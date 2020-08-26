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
        title: 'Origem',
        icon: '#000',
        animation: GoogleMapsAnimation.DROP,
        position: myLocation.latLng,
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
 

    const info: any = await Geocoder.geocode({ address: this.destination.description  })
    

    

    let markerDestination: Marker = this.map.addMarkerSync({
      title: this.destination.description,
      icon: '#000',
      animation: GoogleMapsAnimation.DROP,
      position: info[0].position,
      snippet: '10 Minutos - 5 Km'// coloquei pra verificar se imprime

    });
    
   

    this.googleDirectionsService.route({
      origin: this.originMarker.getPosition(),
      destination: markerDestination.getPosition(),
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

      this.map.moveCamera({ target: points });
    });
  }

  //limpa todos marcadores, LEMBRAR NA HORA DE REFAZER, PRA DEIXAR OS SETADOS TAMBÉM, SE NÃO SÓ FICA O DESTINO
  async back(){
    try {
      await this.map.clear();
      this.destination = null;
      this.addOriginMarker();
    } catch (error) {
      console.log(error);
      
    }
  }

}
