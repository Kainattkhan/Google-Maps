import { Component, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

declare var google: any

@Component({
  selector: 'app-googlemap',
  templateUrl: './googlemap.component.html',
  styleUrls: ['./googlemap.component.css']
})
export class GooglemapComponent implements OnInit, AfterViewInit {

  @ViewChild('gmap') gmap: any;

  options: any;
  map: any;
  overlays: any[] = []; //stores markers, circles, polygons
  dialogVisible: boolean = false; //visibility of a dialog (popup) for adding markers.
  markerTitle?: string | null; 
  // selectedPosition: any;// object representing the latitude and longitude
  selectedPosition: google.maps.LatLng = new google.maps.LatLng(0, 0); // Default position at (0, 0)
 
  infoWindow: google.maps.InfoWindow;

  draggable: boolean = false;

  markersData: any[]; // Array to store the marker data from the JSON file
  cityOptions: any[] = [ 'Rawalpindi','Islamabad', 'Lahore'];
  selectedCity: string;

  markerId: string | null;
  markerAddress: string | null;
  markerName:string | null;

  cityCoordinates: { [key: string]: { lat: number; lng: number; zoom: number } } = {
    Rawalpindi: { lat: 33.6007, lng: 73.0679, zoom: 11 },
    Islamabad: { lat: 33.6844, lng: 73.0479, zoom: 12 },
    Lahore: { lat: 31.5497, lng: 74.3436, zoom: 13 }
  };

  constructor(private http: HttpClient, private messageService: MessageService) { } 

  ngOnInit(): void {
    this.options = {
      center: { lat: 33.6844, lng: 73.0479 }, // Default center coordinates (Islamabad)
      zoom: 12,
    };

    this.http.get<any>('http://localhost:3000/atms').subscribe(
      (data) => {
        console.log('Markers Data:', data);
        this.markersData = data; // The data is now available directly from the server response
        this.initMap(); // Initialize the map and markers
      },
      (error) => {
        console.error('Error loading marker data from JSON server:', error);
      }
    );
  }
  
  addCurrentLocationMarker() {
    this.overlays.push(
      new google.maps.Marker({
        position: this.options.center,
        title: 'Current Location',
        icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', // loads icon from this link
      })
    );
  }

  ngAfterViewInit(): void {
    // Delay initialization of the map to ensure the view is ready
    setTimeout(() => {
      this.map = this.gmap.getMap();
      this.infoWindow = new google.maps.InfoWindow();
      this.initMap(); // Initialize the map and markers
    }, 100);
  }

  initMap() {
    // Check if the browser supports geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.options.center = { lat: latitude, lng: longitude };
          this.options.zoom = 12;

          this.map.setCenter(this.options.center);
          this.map.setZoom(this.options.zoom);

          this.initOverlays(); // Initialize markers after the map is ready
          this.addCurrentLocationMarker(); // Add the current location marker after the map is ready
        },
        (error) => {
          console.error('Error getting current location:', error);
          this.map.setCenter(this.options.center);
          this.map.setZoom(this.options.zoom);
          this.initOverlays(); // Initialize markers even if geolocation fails
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      this.map.setCenter(this.options.center);
      this.map.setZoom(this.options.zoom);
      this.initOverlays(); // Initialize markers if geolocation is not supported
    }
  }
  
  onCityChange(city: string) {
    if (!this.map) {
      return; // Return if map is not yet initialized
    }

    if (city in this.cityCoordinates) {
      const { lat, lng, zoom } = this.cityCoordinates[city];
      this.options.center = { lat, lng };
      this.options.zoom = zoom;
    } else {
      // Use Islamabad as the default city
      this.options.center = { lat: 33.6844, lng: 73.0479 };
      this.options.zoom = 12;
    }

    this.map.setCenter(this.options.center);
    this.map.setZoom(this.options.zoom);

    this.initOverlays();
  }

  handleOverlayClick(event: any) {
    let isMarker = event.overlay.getTitle != undefined;

    if (isMarker) {
      let title = event.overlay.getTitle();
      const markerData = this.markersData.find((data) => data.name === title);

      if (markerData) {
        const content = `
          <div class="custom-info-window">
            <h3>${markerData.name}</h3>
            <p><strong>Name:</strong> ${markerData.name}</p>
            <p><strong>Address:</strong> ${markerData.address}</p>
            <p><strong>Branch code:</strong> ${markerData.branchCode}</p>
            <p><strong>Branch Manager:</strong> ${markerData.branchManager}</p>
            <p><strong>Latitude:</strong> ${markerData.latitude}</p>
            <p><strong>Longitude:</strong> ${markerData.longitude}</p>
            <p><strong>Phone:</strong> ${markerData.phone}</p>
            <p><strong>Working Hours:</strong> ${markerData.workingHours}</p>
          </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, event.overlay);
      }

      this.messageService.add({ severity: 'info', summary: 'Marker Selected', detail: title });
    } else {
      this.messageService.add({ severity: 'info', summary: 'Shape Selected', detail: '' });
    }
  }
  
  initOverlays() {
    this.overlays = [];

    if (!this.markersData || this.markersData.length === 0) {
      return;
    }

    this.markersData.forEach((markerData) => {
      console.log('Adding marker:', markerData.name);
      this.overlays.push(
        new google.maps.Marker({
          position: { lat: markerData.latitude, lng: markerData.longitude },
          title: markerData.name,
        })
      );
    });

    // Add the current location marker
    this.addCurrentLocationMarker();
  }
  
  handleMapClick(event: any) {
    this.dialogVisible = true;
    this.selectedPosition = event.latLng;
    this.markerId = null; // Clear the "id" input field when the map is clicked
    this.markerAddress = null;
    this.markerName = null; // Clear the "address" input field when the map is clicked
  }

  addMarker() {
    const newMarkerData = {
      id: this.markerId,
      name: this.markerName,
      address: this.markerAddress,
      latitude: this.selectedPosition.lat(),
      longitude: this.selectedPosition.lng(),
    };
  
    //HTTP POST request to add the new marker data to the server
    this.http.post<any>('http://localhost:3000/atms', newMarkerData).subscribe(
      (response) => {
        console.log('New marker added:', response);
        // Add the new marker to the map
        this.overlays.push(
          new google.maps.Marker({
            position: { lat: newMarkerData.latitude, lng: newMarkerData.longitude },
            title: newMarkerData.name,
          })
        );
        // Clear the input fields
        this.markerId = null;
        this.markerAddress = null;
        this.markerName = null;
        this.dialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Marker added successfully!' });
      },
      (error) => {
        console.error('Error adding new marker:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add marker!' });
      }
    );
  }

  zoomIn(map: any) {
    map.setZoom(map.getZoom() + 1);
  }

  zoomOut(map: any) {
    map.setZoom(map.getZoom() - 1);
  }
}


