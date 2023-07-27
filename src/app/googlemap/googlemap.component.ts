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
  selectedPosition: any;// object representing the latitude and longitude 
  infoWindow: any;
  draggable: boolean = false;

  markersData: any[]; // Array to store the marker data from the JSON file
  cityOptions: any[] = [ 'Rawalpindi','Islamabad', 'Lahore'];
  selectedCity: string;

  cityCoordinates: { [key: string]: { lat: number; lng: number; zoom: number } } = {
    Rawalpindi: { lat: 33.6007, lng: 73.0679, zoom: 11 },
    Islamabad: { lat: 33.6844, lng: 73.0479, zoom: 12 },
    Lahore: { lat: 31.5497, lng: 74.3436, zoom: 13 }
  };

  constructor(private http: HttpClient, private messageService: MessageService) { }

 
  ngOnInit(): void {
    this.options = {
      center: { lat: 33.6844, lng: 73.0479 },
      zoom: 12
    };

    this.http.get<any>('/assets/markers.json').subscribe(
      (data) => {
        this.markersData = data.atms; // Update to access the 'atms' array from the JSON
        this.onCityChange(this.selectedCity); // Trigger the city change after loading marker data
      },
      (error) => {
        console.error('Error loading marker data from JSON file:', error);
      }
    );
  }

  ngAfterViewInit(): void {
    this.map = this.gmap.getMap();
    this.infoWindow = new google.maps.InfoWindow(); // Initialize the infoWindow
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

  handleMapClick(event: any) {
    this.dialogVisible = true;
    this.selectedPosition = event.latLng;
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
      this.overlays.push(
        new google.maps.Marker({
          position: { lat: markerData.latitude, lng: markerData.longitude },
          title: markerData.name
        })
      );
    });
  }

  addMarker() {
    this.overlays.push(new google.maps.Marker({ position: { lat: this.selectedPosition.lat(), lng: this.selectedPosition.lng() }, title: this.markerTitle, draggable: this.draggable }));
    this.markerTitle = null;
    this.dialogVisible = false;
  }

  handleDragEnd(event: any) {
    this.messageService.add({ severity: 'info', summary: 'Marker Dragged', detail: event.overlay.getTitle() });
  }

  zoomIn(map: any) {
    map.setZoom(map.getZoom() + 1);
  }

  zoomOut(map: any) {
    map.setZoom(map.getZoom() - 1);
  }

  clear() {
    this.overlays = [];
  }

}
