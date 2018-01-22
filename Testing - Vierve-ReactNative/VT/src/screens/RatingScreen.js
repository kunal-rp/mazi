import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import StarRating from 'react-native-star-rating';
import ServerTools from '../utils/ServerTools';
import Db_Helper_User from '../utils/Db_Helper_User';

class RatingScreen extends Component{
	static navigatorStyle= {
	  navBarHidden: true,
  	screenBackgroundColor: '#2f4858',
	  statusBarColor: '#2f4858'
 	};

	constructor(props) {
		super(props);
		this.state = {
      starCount: 2.5
    };
    this.FinishSession = this.FinishSession.bind(this);
    this.submitRating = this.submitRating.bind(this);
	}

	onStarRatingPress(rating) {
    this.setState({
      starCount: rating
    });
  }

  async submitRating() {
  	let sessionData = await Db_Helper_User.getSessionData();
    let response = await ServerTools.rateMatch({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'action': 'rateMatch', rating: this.state.starCount});
    if(response){
    	if(response.code==1){
    		console.log(response.message);
    	}
    }
  }

	FinishSession() {
		this.submitRating();
		this.props.navigator.resetTo({
			screen: 'vt.MainScreen',
			animated: true,
			animationType: 'fade',
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptTitleText}>Rate this Match!</Text>
					<Text style={styles.promptDescriptionText}>@user picked up @user</Text>
				</View>
				<View style={styles.info}>
					<Text style={styles.infoText}>Ratings play a big role in your matches. Being fair in your rating will reflect positively in your future matches.</Text>
				</View>	
				<View style={styles.ratingContainer}>
					<StarRating
		        disabled={false}
		        maxStars={5}
		        rating={this.state.starCount}
		        halfStarEnabled={true}
		        selectedStar={(rating) => this.onStarRatingPress(rating)}
		        starColor={'#2196F3'}
	      	/>
      	</View>
				<View style={{marginBottom: 10}}>
					<Text style={styles.infoText}>Thank you for using Vierve!</Text>
				</View>
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.FinishSession} underlayColor="#2f4858">
			    	<View style={styles.button}>
			    		<Text style={styles.buttonText}>SUBMIT</Text>
			    	</View>
			    </TouchableHighlight>
		    </View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex:1,
		paddingTop: 25,
	},
	prompt: {
		flex: 0,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	ratingContainer: {
		flex:1,
		// backgroundColor: 'red',
		alignItems: 'center',
		marginTop: 30
	},
	info: {
		marginTop: 20,
		flex: 0,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	infoText: {
		color: 'white',
		fontSize: 20,
		textAlign: 'center'
	},
	promptTitleText: {
		color: 'white',
		fontSize: 40
	},
	promptDescriptionText: {
		color: 'white',
		fontSize: 20,
	},
	buttonContainer: {
		flex:0,
		justifyContent: 'flex-end',
		// backgroundColor: 'red',
  	marginBottom: 10,
  },
	button: {
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#2196F3'
  },
  buttonText: {
		padding: 15,
    color: 'white'
  },
});

export default RatingScreen