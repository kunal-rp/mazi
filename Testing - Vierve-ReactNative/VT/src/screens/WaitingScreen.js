import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';

class WaitingScreen extends Component{
	static navigatorStyle={
		navBarHidden: true,
		statusBarColor: '#2f4858',
		screenBackgroundColor: '#2f4858',
	};

	constructor(props) {
		super(props);
		this.AttemptMatch = this.AttemptMatch.bind(this);
	}

	componentDidMount() {
		setTimeout(this.AttemptMatch,3000)
	}

	AttemptMatch() {
		this.props.navigator.push({
			screen: 'vt.MatchScreen',
			backButtonHidden: true,
		});
	}

	CancelSearch = () => {
		this.props.navigator.pop({
			animated: true,
			animationType: 'fade',
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptSizeTwo}>Searching for a</Text>
					<Text style={styles.promptSizeOne}>Parking Spot</Text>
					<Text style={styles.promptSizeTwo}>at</Text>
					<Text style={styles.promptSizeOne}>Parking Lot J</Text>
					<Text style={styles.promptSizeTwo}>at</Text>
					<Text style={styles.promptSizeOne}>California Polytechnic State University Pomona</Text>
				</View>
				
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.CancelSearch} underlayColor="#2f4858">
			    	<View style={styles.button}>
			    		<Text style={styles.buttonText}>CANCEL</Text>
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
		marginTop: 25,
    backgroundColor: '#2f4858',
	},
	prompt: {
		flex: 1,
		flexDirection: 'column',
	},
	promptSizeOne: {
		color: 'white',
		fontSize: 28,
		textAlign: 'center'
	},
	promptSizeTwo: {
		textAlign: 'center',
		color: 'white',
		fontSize: 20,
	},
	buttonContainer: {
  	marginBottom: 10
  },
	button: {
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  buttonText: {
  	fontSize: 16,
		padding: 15,
    color: '#2f4858'
  },
});

export default WaitingScreen