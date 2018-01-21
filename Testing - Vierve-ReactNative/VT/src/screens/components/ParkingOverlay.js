import React, {Component} from 'react';
import {StyleSheet, View, Image, Text, TouchableOpacity, Dimensions} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import Db_Helper_Data from '../../utils/Db_Helper_Data';
import ServerTools from '../../utils/ServerTools';

const {width, height} = Dimensions.get('window');

const LATITUDE_DELTA = 0.002;
const LONGITUDE_DELTA = 0.004;

class ParkingOverlay extends Component {
	constructor(props) {
		super(props);
    this.state = {
      parkingLots: [],
      selected: '',
      coordinates: [],
    };
    this.onParkingSet = this.onParkingSet.bind(this);
    this.addMarkers = this.addMarkers.bind(this);
	}

  async loadParkingData() {
    let parkingLots = await Db_Helper_Data.getParkingLotsFromCollege(this.props.college);
    if(this.props.parkingLot && parkingLots.names.indexOf(this.props.parkingLot) >= 0){
      this.setState({parkingLots: parkingLots.names, selected: this.props.parkingLot, coordinates: parkingLots.coordinates});
      let i = this.state.parkingLots.indexOf(this.props.parkingLot);
      this.menu.select(i);
      this.scrollMaptoParkingLot(i);
    }
    else{
      this.setState({parkingLots: parkingLots.names, selected: parkingLots[0], coordinates: parkingLots.coordinates});
      this.menu.select(0);
      this.scrollMaptoParkingLot(0);
    }
  }

  componentWillMount() {
    this.loadParkingData();
  }

  componentDidMount() {
    this.addMarkers();
  }

  async addMarkers() {
    let markers = await Db_Helper_Data.getParkingLotMarkersFromCollege(this.props.college);
    this.props.addMarkers(markers);
  }

  async scrollMaptoParkingLot(id){
    const region = {
      latitude: this.state.coordinates[id].latitude,
      longitude: this.state.coordinates[id].longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    this.props.map.animateToRegion(region);
  }

  updateSelected(id,parkingLot) {
    this.setState({selected: parkingLot});
    this.scrollMaptoParkingLot(id);
  }

  onParkingSet() {
    this.props.onParkingSet(this.state.selected);
  }

  setParkingSelectionTo(parkingLot){
    this.setState({selected: parkingLot});
    this.menu.select(this.state.parkingLots.indexOf(parkingLot));
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.dropdownContainer}>
          <ModalDropdown
            ref={ref => {this.menu = ref}}
            defaultIndex={0}
            defaultValue={this.state.parkingLots[0]}
            style={styles.dropdownFrame}
            dropdownStyle={styles.dropdown}
            dropdownTextStyle={{fontSize: 20}}
            textStyle={{fontSize: 22}}
            options={this.state.parkingLots}
            onSelect={(id,parkingLot) => this.updateSelected(id,parkingLot)}
          />
        </View> 
        <View style={styles.arrowImageContainer}>
          <TouchableOpacity onPress={this.props.onBackPress}>
            <Image
              style={styles.image}
              source={require('../../res/left-arrow.png')}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.LocationViewContainer}>
          <TouchableOpacity onPress={this.props.onGetPosition}>
            <Image
              style={styles.image}
              source={require('../../res/ic_my_location.png')}
            />
          </TouchableOpacity>
        </View>
				<View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this.onParkingSet} underlayColor="white">
            <View style={styles.button}>
              <Text style={styles.buttonText}>SET PARKING LOT</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    // ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 10,
    flex: 1,
    flexDirection: 'row',
  },
  dropdownFrame: {
    backgroundColor: 'white',
    padding: 10,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10
  },
  dropdown: {
    backgroundColor: 'white',
    marginTop: 22,
    marginLeft: -7,
    // height: 300,
    width: 200
  },
  arrowImageContainer: {
    position: 'absolute',
    left: 20,
    top: height-125
  },
  LocationViewContainer: {
    position: 'absolute',
    right: 20,
    top: 70,
  },
  image: {
    width: 35,
    height: 35,
    tintColor: '#2f4858'
  },
  buttonContainer: {
    position: 'absolute',
    top: height-135,
  },
  button: {
    // alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
  buttonText: {
    padding: 15,
    color: '#2196F3'
  },
});

export default ParkingOverlay