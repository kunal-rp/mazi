import React, {Component} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, Dimensions} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import Db_Helper_Data from '../../utils/Db_Helper_Data';
import Db_Helper_User from '../../utils/Db_Helper_User';
import ServerTools from '../../utils/ServerTools';

const {width, height} = Dimensions.get('window');

const LATITUDE_DELTA = 0.0492;
const LONGITUDE_DELTA = 0.0001;

class CollegeOverlay extends Component {
	constructor(props) {
		super(props);
    this.state = {
      colleges : [],
      selected: ''
    };
    this.onPark = this.onPark.bind(this);
    this.onRide = this.onRide.bind(this);
	}

  //checks and updates local data against server data
  async checkDataVersion() {
    let response = await ServerTools.getData();
    if(response != null){
      let code = await Db_Helper_Data.getCode();
      if(code){
        if(code < response.code){ // update local copy with server copy
          Db_Helper_Data.updateData(response);
        }
      }
      else{ //there is no data in app storage
        // console.log('college overlay here');
        Db_Helper_Data.updateData(response);
      }
    }
  }

  //gets list of college names from storage for user access
  async loadCollegeData() {
    let colleges = await Db_Helper_Data.getCollegeList();
    if(this.props.college){
      this.setState({colleges: colleges, selected: this.props.college});
      this.menu.select(this.state.colleges.indexOf(this.props.college));
      this.scrollMaptoCollege(this.props.college);
    }
    else{
      this.setState({colleges: colleges, selected: colleges[0]});
      this.menu.select(0);
      this.scrollMaptoCollege(colleges[0]);
    }
  }

  async getUserStatus() {
    let sessionData = await Db_Helper_User.getSessionData();
    let response = await ServerTools.getUserStatus({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'action': 'getUserStatus'});
    if(response.code==1) console.log(response.data);
  }

  componentWillMount() {
    this.checkDataVersion();
    this.loadCollegeData();
    this.getUserStatus();
  }

  async scrollMaptoCollege(college) {
    let coords = await Db_Helper_Data.getCollegeCoordinates(college);
    if(coords){
      const region = {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      this.props.map.animateToRegion(region);
    }
  }

  updateSelectedCollege(college) {
    this.setState({selected: college});
    this.scrollMaptoCollege(college)
  }

  onPark() {
    this.props.onPark(this.state.selected);
  }

  onRide() {
    this.props.onRide(this.state.selected);
  }


  render() {

    return (
      <View style={styles.container}>
        <View style={styles.dropdownContainer}>
          <ModalDropdown
            ref={ref => {this.menu = ref}}
            defaultIndex={0}
            defaultValue={this.state.colleges[0]}
            style={styles.dropdownFrame}
            dropdownStyle={styles.dropdown}
            dropdownTextStyle={{fontSize: 18}}
            textStyle={{fontSize: 22}}
            options={this.state.colleges}
            onSelect={(id,college) => this.updateSelectedCollege(college)}
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
					<TouchableOpacity onPress={this.onPark} underlayColor='white'>
				    <View style={styles.button}>
				    	<Text style={styles.buttonText}>PARK</Text>
				    </View>
				   </TouchableOpacity>
			   </View>
			   <View style={styles.buttonRideContainer}>
					<TouchableOpacity onPress={this.onRide} underlayColor='white'>
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
    width: 300,
    marginTop: 22,
    marginLeft: 0
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