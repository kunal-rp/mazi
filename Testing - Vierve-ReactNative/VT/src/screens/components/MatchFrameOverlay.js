import React, {Component} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, Dimensions} from 'react-native';
const {width, height} = Dimensions.get('window');

function Connected(props){
	return(
		<View style={{backgroundColor: 'green', width: 170, height: 25}}>
			<Text style={{fontSize: 20, color: 'white', alignSelf: 'center'}}>Connected</Text>
		</View>
	);
}

function Disconnected(props){
	return(
		<View style={{backgroundColor: 'red', width: 170, height: 25}}>
			<Text style={{fontSize: 20, color: 'white', alignSelf: 'center'}}>Disconnected</Text>
		</View>
	);
}

class MatchFrameOverlay extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		let connection1 = <Connected />;
		let connection2 = <Disconnected />;
		return(
			<View style={styles.container}>
				<View style={styles.statusbox}>
					<View style={styles.topSection}>
						<Text style={styles.boxText}>Parker</Text>
						<Text style={styles.boxText}>@user1</Text>
						<Text style={styles.boxText}>Rider</Text>
						<Text style={styles.boxText}>@user2</Text>
					</View>
					<View style={styles.bottomSection}>
						{connection1}
						{connection1}
					</View>
				</View>
				<View style={styles.LocationViewContainer}>
          <TouchableOpacity onPress={this.props.onGetPosition}>
            <Image
              style={styles.image}
              source={require('../../res/ic_my_location.png')}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.directionbuttonContainer}>
          <TouchableOpacity onPress={this.props.getDirections} underlayColor="white">
            <View style={styles.directionButton}>
              <Text style={styles.buttonText}>GET DIRECTIONS</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this.props.locationSet} underlayColor="white">
            <View style={styles.button}>
              <Text style={styles.buttonText}>I AM AS CLOSE AS I CAN GET</Text>
            </View>
          </TouchableOpacity>
        </View>
			</View>
		);
	}
}


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  statusbox : {
  	flex: 1,
  	flexDirection: 'column',
  	height: 70,
  	width: width-10,
  	margin: 5,
  	padding: 5,
  	backgroundColor: '#2f4858'
  },
  topSection : {
  	flex: 1,
  	flexDirection: 'row',
  	justifyContent: 'space-between',
  },
  bottomSection : {
  	flex: 1,
  	flexDirection: 'row',
  	justifyContent: 'space-around',
  },
  boxText : {
  	fontSize: 20, 
  	color: 'white'
  },
  LocationViewContainer: {
    position: 'absolute',
    right: 20,
    top: 80,
  },
  image: {
    width: 35,
    height: 35,
    tintColor: '#2f4858'
  },
  directionbuttonContainer: {
    position: 'absolute',
    top: height-195,
  },
  directionButton: {
  	alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#2196F3',
  },
  buttonContainer: {
    position: 'absolute',
    width: width,
    top: height-135,
  },
  button: {
  	alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#2f4858',
  },
  buttonText: {
    padding: 15,
    color: 'white'
  },
 });

export default MatchFrameOverlay