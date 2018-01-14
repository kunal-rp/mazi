import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, ScrollView, KeyboardAvoidingView } from 'react-native';
import { TextField } from 'react-native-material-textfield';
import ModalDropdown from 'react-native-modal-dropdown';
import Db_Helper_User from '../utils/Db_Helper_User';
import ServerTools from '../utils/ServerTools';
import {showNotification} from '../utils/Toolbox';


class BugReportScreen extends Component{
	static navigatorStyle = {
	  navBarTextFontSize: 28,
  	screenBackgroundColor: '#2f4858',
		statusBarColor: '#2f4858',
		navBarBackgroundColor: '#2f4858',
		navBarTextColor: 'white',
	  navBarButtonColor: 'white',
	};
	constructor(props) {
		super(props);
		this.state = {
			options: ['Suggestion','Report a Bug'],
			selected: 0,
			report: '',
		};

		this.submitFeedback = this.submitFeedback.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	handleSelect(index) {
		this.setState({selected: index});
	}

	async submitFeedback() {
		if(this.state.report){
			let type = this.state.selected == 0 ? 'Suggestion' : 'Bug Report';
			let sessionData = await Db_Helper_User.getSessionData();
			let response = await ServerTools.addSuggestion({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'type': type, 'system_data': 'ios', 'comment': this.state.report});
			if(response != null){
				if(response.code==1) showNotification(this.props.navigator, response.code, response.message);
				else showNotification(this.props.navigator, 0, 'Please try again later');
			}
		}
	}

	render() {
		return (
			<ScrollView>
			<KeyboardAvoidingView keyboardVerticalOffset={220} behavior="position">
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptDescriptionText}>Users can give suggestions about changes</Text>
					<Text style={styles.promptDescriptionText}>to the app, or report bugs they may have</Text>
					<Text style={styles.promptDescriptionText}>encountered while using Vierve! Be as</Text>
					<Text style={styles.promptDescriptionText}>descriptive as you desire.</Text>
					<Text style={styles.promptDescriptionText}>What new features would you like to see?</Text>
					<Text style={styles.promptDescriptionText}>What bug did you run into?</Text>
				</View>
				<View style={styles.typeContainer}>
					<Text style={styles.titleLabel}>Select Type:</Text>
					<View style={styles.dropdownContainer}>
						<ModalDropdown
							defaultIndex={0}
							defaultValue={this.state.options[0]}
							onSelect={this.handleSelect}
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
	        	value={this.state.report}
	        	onChangeText={(v) => this.setState({report: v})}
	        	fontSize={20}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='done'
	        	blurOnSubmit={true}
            autoCapitalize='sentences'
            animationDuration={150}
            characterRestriction={200}
            multiline={true}
            maxLength={200}
	        />
	      </View>
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.submitFeedback} underlayColor="#2f4858">
			    	<View style={styles.button}>
			    		<Text style={styles.buttonText}>SUBMIT</Text>
			    	</View>
			    </TouchableHighlight>
		    </View>
			</View>
			</KeyboardAvoidingView>
			</ScrollView>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 10
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