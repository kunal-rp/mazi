import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import { TextField } from 'react-native-material-textfield';
import ModalDropdown from 'react-native-modal-dropdown';

class BugReportScreen extends Component{
	static navigatorStyle = {
		navBarHidden: true,
	  screenBackgroundColor: '#2f4858',
	 	statusBarColor: '#2f4858'
	};
	constructor(props) {
		super(props);
		this.state = {
			options: ['Suggestion','Report a Bug'],
		};
	}

	AttemptRegister = () => {
		this.props.navigator.pop({
			animated: true,
			animationType: 'fade',
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptTitleText}>Suggestions / Reporting a</Text>
					<Text style={styles.promptTitleText}>Bug</Text>
					<Text style={styles.promptDescriptionText}>Users can give suggestions about changes</Text>
					<Text style={styles.promptDescriptionText}>to the app, or report bugs they may have</Text>
					<Text style={styles.promptDescriptionText}>encountered while using Vierve! Be as</Text>
					<Text style={styles.promptDescriptionText}>descriptive as you desire.</Text>
					<Text style={styles.promptDescriptionText}>What new features would you like to see?</Text>
					<Text style={styles.promptDescriptionText}>What bug did you run into?</Text>
				</View>
				<View style={styles.typeContainer}>
					<Text style={styles.titleLabel}>Type:</Text>
					<View style={styles.dropdownContainer}>
						<ModalDropdown
							defaultIndex={0}
							defaultValue={this.state.options[0]}
							style={styles.dropdownFrame}
							dropdownStyle={styles.dropdown}
							dropdownTextStyle={{fontSize: 20, color: 'white', backgroundColor: '#2F2F2F'}}
							textStyle={{fontSize: 20, color:'white'}}
							dropdownTextHighlightStyle={{color:'white'}}
							options={this.state.options}
						/>
					</View>
				</View>
				<View style={{marginTop: 15, marginLeft: 15, marginRight: 15}}>
					<TextField
	        	label="Report Description"
	        	title="300 Characters Max"
	        	fontSize={20}
	        	enablesReturnKeyAutomatically={true}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            animationDuration={150}
            multiline={true}
	        />
	      </View>
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.AttemptRegister} underlayColor="#2f4858">
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
		paddingTop: 20,
    backgroundColor: '#2f4858',
	},
	prompt: {
		flex: 0,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	promptTitleText: {
		color: 'white',
		fontSize: 28
	},
	promptDescriptionText: {
		color: 'white',
		fontSize: 20,
	},
	typeContainer: {
		marginLeft: 10,
		marginTop: 10
	},
	titleLabel: {
		color: 'lightgray',
		fontSize: 20,
	},
	dropdownContainer: {
  	flex: 0,
  	flexDirection: 'row',
  	paddingLeft: 10,
  },
  dropdownFrame: {
  	flex: 0,
  	alignItems: 'flex-start',
  	marginTop: 5,
  	backgroundColor: '#2F2F2F'
  },
  dropdown: {
  	flex:1,
  	flexDirection: 'row',
  	alignItems:'flex-start',
  	backgroundColor: 'transparent',
  	borderWidth:0,
  	marginTop: -25
  },
	buttonContainer: {
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
  }
});

export default BugReportScreen