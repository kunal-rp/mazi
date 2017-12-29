import React, {Component} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, Dimensions} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';

const {width, height} = Dimensions.get('window');

class CollegeOverlay extends Component {
  collegeOptions = ['Cal Poly Pomona','Mt. Sac','Cal Poly SLO'];

	constructor(props) {
		super(props);
	}

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.dropdownContainer}>
          <ModalDropdown
            defaultIndex={0}
            defaultValue={this.collegeOptions[0]}
            style={styles.dropdownFrame}
            dropdownStyle={styles.dropdown}
            dropdownTextStyle={{fontSize: 26}}
            textStyle={{fontSize: 26}}
            options={this.collegeOptions}
          />
        </View>
        <View style={styles.LocationViewContainer}>
          <TouchableOpacity onPress={this.props.onGetPosition}>
            <Image
              style={styles.image}
              source={require('../../res/ic_my_location.png')}
            />
          </TouchableOpacity>
        </View>
				<View style={styles.buttonParkContainer}>
					<TouchableOpacity onPress={this.props.onPark} underlayColor='white'>
				    <View style={styles.button}>
				    	<Text style={styles.buttonText}>PARK</Text>
				    </View>
				   </TouchableOpacity>
			   </View>
			   <View style={styles.buttonRideContainer}>
					<TouchableOpacity onPress={this.props.onRide} underlayColor='white'>
				    <View style={styles.button}>
				    	<Text style={styles.buttonText}>RIDE</Text>
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
    marginLeft: -7
  },
  buttonParkContainer: {
    position: 'absolute',
  	top: height-150,
  	left: 20,
  },
  buttonRideContainer: {
  	position: 'absolute',
  	top: height-150,
  	right: 20,
  },
  button: {
  	width: 60,
  	height: 60,
  	borderRadius: 60/2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3'
  },
  buttonText: {
    color: 'white'
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
});

export default CollegeOverlay