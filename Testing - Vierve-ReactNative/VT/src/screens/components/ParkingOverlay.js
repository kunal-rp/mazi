import React, {Component} from 'react';
import {StyleSheet, View, Image, Text, TouchableOpacity, Dimensions} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';

const {width, height} = Dimensions.get('window');

class ParkingOverlay extends Component {
  parkingOptions = ['Parking Lot J', 'Parking Lot M', 'Parking Log L', 'Parking Lot A', 'Parking Lot B', 'Parking Structure 2']

	constructor(props) {
		super(props);
	}

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.dropdownContainer}>
          <ModalDropdown
            defaultIndex={0}
            defaultValue={this.parkingOptions[0]}
            style={styles.dropdownFrame}
            dropdownStyle={styles.dropdown}
            dropdownTextStyle={{fontSize: 26}}
            textStyle={{fontSize: 26}}
            options={this.parkingOptions}
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
          <TouchableOpacity onPress={this.props.onParkingSet} underlayColor="white">
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
    height: 300
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