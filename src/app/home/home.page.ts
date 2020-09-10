import { async } from '@angular/core/testing';
import { Platform, LoadingController } from '@ionic/angular';
import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { Environment, GoogleMap, GoogleMaps, GoogleMapOptions, GoogleMapsEvent, MyLocation, GoogleMapsAnimation, Marker, Geocoder, ILatLng } from '@ionic-native/google-maps';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild('map', { static: true }) mapElement: any;
  private loading: any;
  private map: GoogleMap;
  public search: string = '';
  private googleAutocomplete = new google.maps.places.AutocompleteService();
  public searchResults = new Array<any>();
  private originMarker: Marker;
  public destination: any;
  public distance: any;
  private googleDirectionsService = new google.maps.DirectionsService();


  constructor(
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.mapElement = this.mapElement.nativeElement;

    this.mapElement.style.width = this.platform.width() + 'px';
    this.mapElement.style.height = this.platform.height() + 'px';


    this.loadMap();
  }

  async loadMap() {
    this.loading = await this.loadingCtrl.create({
      message: 'Por favor, aguarde...'
    });
    await this.loading.present();


    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyCPvZoCPQWVuQI_cdcfPZ0MBYDp8Ox8C5k',
      'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyCPvZoCPQWVuQI_cdcfPZ0MBYDp8Ox8C5k'
    });

    const mapOptions: GoogleMapOptions = {
      controls: {
        zoom: false
      }
    };


    this.map = GoogleMaps.create(this.mapElement, mapOptions);

    try {
      await this.map.one(GoogleMapsEvent.MAP_READY);

      this.addMarkersToMap(this.markers)
      this.addOriginMarker();
    } catch (error) {
      console.error(error);

    }


  }

  async addOriginMarker() {
    try {
      const myLocation: MyLocation = await this.map.getMyLocation();


      await this.map.moveCamera({
        target: myLocation.latLng,
        zoom: 18
      });

      this.originMarker = this.map.addMarkerSync({
        title: 'Localização Atual',
        icon: '#000',
        animation: GoogleMapsAnimation.DROP,
        position: myLocation.latLng,
        locs: ''

      });

    } catch (error) {
      console.error(error);
    } finally {
      this.loading.dismiss();
    }

  }

  searchChanged() {
    if (!this.search.trim().length) return;

    this.googleAutocomplete.getPlacePredictions({ input: this.search }, predictions => {
      this.ngZone.run(() => {
        this.searchResults = predictions;
      });
    });
  }

  async calcRoute(item: any) {
    this.search = '';
    this.destination = item;
    


    const info: any = await Geocoder.geocode({ address: this.destination.description })

    this.googleDirectionsService.route({
      origin: this.originMarker.getPosition(),
      destination: this.destination.description,
      travelMode: 'DRIVING'
    }, async results => {
      console.log(results);
      const points = new Array<ILatLng>();

      const routes = results.routes[0].overview_path;

      const duracao = results.routes[0].legs[0].duration;// Pegando a duração do trajeto
      console.log(duracao);

      const distancia = results.routes[0].legs[0].distance; //pegando a distancia do trajeto
      console.log(distancia);


      for (let i = 0; i < routes.length; i++) {
        points[i] = {
          lat: routes[i].lat(),
          lng: routes[i].lng()
        }
      }

      await this.map.addPolyline({
        points: points,
        color: '#000',
        width: 3
      });

      let markerDestination: Marker = this.map.addMarkerSync({
        title: this.destination.description,
        icon: '#000',
        animation: GoogleMapsAnimation.DROP,
        position: info[0].position,
        snippet: "Distância: " + distancia.text + " | " + " Tempo: " + duracao.text
      });
      this.map.moveCamera({ target: points });
      
      
    });
  }

  //limpa todos marcadores, exceto Localização atual e os pontos fixos = ônibus.
  async back() {
    try {
      await this.map.clear();
      this.destination = null;
      this.addOriginMarker();
      this.addMarkersToMap(this.markers);
    
    } catch (error) {
      console.log(error);

    }
  }

  markers: any = [
    {
      title: "Ônibus Rota Pe Ulrico",
      latitude: -26.06883406,
      longitude: -53.03480816
    },
    {
      title: "Ônibus Rota Cango",
      latitude: -26.08671845,
      longitude: -53.04239993
    },
    {
      title: "Ônibus Rota Sta Bárbara",
      latitude: -26.08463345,
      longitude: -53.09092286
    }
  ];

  async addMarkersToMap(markers) {
    for (let marker of markers) {
      let position = { "lat": marker.latitude, "lng": marker.longitude }
      this.originMarker = this.map.addMarkerSync({
        title: marker.title,
        icon: '#000',
        animation: GoogleMapsAnimation.DROP,
        position: position,
        locs: ''
      });
    }
  }

}

/**


  addInfoWindowToMarker(marker) {
    let infoWindowContent = '<div id="content">' +
                              '<h2 id="firstHeading" class"firstHeading">' + marker.title + '</h2>' +
                              '<p>Latitude: ' + marker.latitude + '</p>' +
                              '<p>Longitude: ' + marker.longitude + '</p>' +
                              '<ion-button id="navigate">Verificar Rota</ion-button>' +
                            '</div>';

    let infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent
    });

    marker.addListener('click', () => {
      this.closeAllInfoWindows();
      infoWindow.open(this.map, marker);

      google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        document.getElementById('navigate').addEventListener('click', () => {
          console.log('navigate button clicked!');
          // code to navigate using google maps app
          window.open('https://www.google.com/maps/dir/?api=1&destination=' + marker.latitude + ',' + marker.longitude);
        });
      });

    });
    this.infoWindows.push(infoWindow);
  }
  } */

