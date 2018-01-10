import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, TouchableOpacity, Image} from 'react-native';
import { TextField } from 'react-native-material-textfield';
import Db_Helper_User from '../utils/Db_Helper_User';
import ServerTools from '../utils/ServerTools';
import {showNotification} from '../utils/Toolbox';

class ProfileScreen extends Component{
	static navigatorStyle = {
    navBarTextFontSize: 28,
  	screenBackgroundColor: '#2f4858',
		statusBarColor: '#2f4858'
	};

	constructor(props) {
		super(props);
    this.state = {
      email: '',
      username: '',
      password: '',
      npassword: '',
      cpassword: ''
    };
    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
	}

  async loadEmail(){
    var userInfo = await Db_Helper_User.getInfo();
    if(userInfo){
      this.setState({email: userInfo.user_email});
    }
  }

  componentDidMount() {
    this.loadEmail();
  }

  async updateUsername() {
    if(this.state.username){ // 1. check username filled in
      let code = await ServerTools.getCode();
      let sessionData = await Db_Helper_User.getSessionData();
      let response = await ServerTools.updateUser({'token_gen': code, 'user_name': this.state.username, 'user_password': '', 'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'update_type': 'username'});
      if(response != null){
        showNotification(this.props.navigator, response.code, response.message);
      }
    }
  }

  async updatePassword() {
    if(this.state.password != '' && this.state.npassword != '' && this.state.cpassword != ''){ // 1. check that password fields filled in
      var userInfo = await Db_Helper_User.getInfo();
      if(userInfo.user_password == this.state.password){ // 2. check that correct current password entered
        if(this.state.npassword != null && this.state.cpassword != null && this.state.npassword==this.state.cpassword){ // 3. verify new password
          let code = await ServerTools.getCode();
          let sessionData = await Db_Helper_User.getSessionData();
          console.log(sessionData);
          let response = await ServerTools.updateUser({'token_gen': code, 'user_name': '', 'user_password': this.state.cpassword, 'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'update_type': 'password'});
          if(response != null){
            showNotification(this.props.navigator, response.code, response.message);
          }
        } else showNotification(this.props.navigator, 0, 'New Password does not match');
      } else showNotification(this.props.navigator,0,'Incorrect current password');
    }
  }

	render() {
		return (
			<View style={styles.container}>
				<TextField
        	label="Username"
        	fontSize={20}
        	title="To update: edit and press below"
        	enablesReturnKeyAutomatically={false}
        	textColor="white"
        	baseColor="white"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          animationDuration={150}
          value={this.state.username}
          onChangeText={(v) => this.setState({username: v})}
          containerStyle={{marginLeft:15, marginRight: 15}}
        />
        <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.updateUsername} underlayColor="#2f4858">
		    		<View style={styles.updateButton}>
		    			<Text style={styles.buttonText}>UPDATE USERNAME</Text>
		    		</View>
		    	</TouchableHighlight>
	    	</View>
        <Text style={styles.titleLabel}>Email:</Text>
        <View style={styles.emailValueContainer}>
        	<Text style={styles.emailValue}>{this.state.email}</Text>
        </View>
        <Text style={styles.titleLabel}>Update Password:</Text>

        <TextField
        	label="Current Password"
        	fontSize={20}
        	enablesReturnKeyAutomatically={true}
        	textColor="white"
        	baseColor="lightgrey"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          secureTextEntry={true}
          animationDuration={150}
          value={this.state.password}
          onChangeText={(v) => this.setState({password: v})}
          containerStyle={{marginTop:5,marginLeft:15, marginRight: 15}}

        />
        <TextField
        	label="New Password"
        	fontSize={20}
        	enablesReturnKeyAutomatically={true}
        	textColor="white"
        	baseColor="lightgrey"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          secureTextEntry={true}
          animationDuration={150}
          value={this.state.npassword}
          onChangeText={(v) => this.setState({npassword: v})}
          containerStyle={{marginLeft:15, marginRight: 15}}
        />
        <TextField
        	label="Confirm Password"
        	fontSize={20}
        	enablesReturnKeyAutomatically={true}
        	textColor="white"
        	baseColor="lightgrey"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          secureTextEntry={true}
          animationDuration={150}
          value={this.state.cpassword}
          onChangeText={(v) => this.setState({cpassword: v})}
          containerStyle={{marginLeft:15, marginRight: 15}}
        />
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.updatePassword} underlayColor="#2f4858">
			    	<View style={styles.updateButton}>
			    		<Text style={styles.buttonText}>UPDATE PASSWORD</Text>
			    	</View>
			    </TouchableHighlight>
		    </View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 10,
    backgroundColor: '#2f4858',
	},
	prompt: {
		flex: 0,
		alignItems: 'center',
	},
	promptTitleText: {
		color: 'white',
		fontSize: 28
	},
	titleLabel: {
		color: 'white',
		fontSize: 20,
		marginLeft:10
	},
	emailValueContainer: {
		flex:0,
		alignItems: 'flex-end',
		marginRight: 10
	},
	emailValue: {
		color: 'lightgrey',
		fontSize: 20
	},
	buttonContainer: {
  	paddingTop: 10,
  },
	updateButton: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#2196F3'
  },
  buttonText: {
		padding: 15,
    color: 'white'
  },
});

export default ProfileScreen