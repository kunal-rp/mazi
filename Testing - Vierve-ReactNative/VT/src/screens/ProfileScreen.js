import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, ScrollView, KeyboardAvoidingView} from 'react-native';
import { TextField } from 'react-native-material-textfield';
import Db_Helper_User from '../utils/Db_Helper_User';
import ServerTools from '../utils/ServerTools';
import {showNotification} from '../utils/Toolbox';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';


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
      nusername: '',
      password: '',
      npassword: '',
      cpassword: '',
      secureTextEntry: true,
      nsecureTextEntry: true,
      csecureTextEntry: true,
      verticalOffset: -100
    };
    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);

    this.onAccessoryPress = this.onAccessoryPress.bind(this);
    this.renderPasswordAccessory = this.renderPasswordAccessory.bind(this);

    this.passwordRef = this.updateRef.bind(this, 'password');
    this.npasswordRef = this.updateRef.bind(this, 'npassword');
    this.cpasswordRef = this.updateRef.bind(this, 'cpassword');

    this.onSubmitPassword = this.onSubmitPassword.bind(this);
    this.onSubmitNPassword = this.onSubmitNPassword.bind(this);
	}

  async loadEmail(){
    var userInfo = await Db_Helper_User.getInfo();
    if(userInfo){
      this.setState({email: userInfo.user_email, username: userInfo.user_name});
    }
  }

  componentDidMount() {
    this.loadEmail();
  }

  async updateUsername() {
    if(this.state.nusername){ // 1. check nusername filled in
      let sessionData = await Db_Helper_User.getSessionData();
      let userInfo = await Db_Helper_User.getInfo();
      let response = await ServerTools.updateUser({'token_gen': sessionData.token_gen, 'user_name': this.state.nusername, 'user_password': '', 'user_email': userInfo.user_email ,'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'update_type': 'username'});
      if(response != null){
        if(response.code==1){
          showNotification(this.props.navigator, 1, 'Username changed');
          this.setState({username: this.state.nusername});
        }
        else showNotification(this.props.navigator, response.code, response.message);
      }
    }
  }

  async updatePassword() {
    if(this.state.password != '' && this.state.npassword != '' && this.state.cpassword != ''){ // 1. check that password fields filled in
      var userInfo = await Db_Helper_User.getInfo();
      if(userInfo.user_password == this.state.password){ // 2. check that correct current password entered
        if(this.state.npassword != null && this.state.cpassword != null && this.state.npassword==this.state.cpassword){ // 3. verify new password
          let sessionData = await Db_Helper_User.getSessionData();
          // console.log(sessionData);
          let response = await ServerTools.updateUser({'token_gen': sessionData.token_gen, 'user_name': '', 'user_password': this.state.cpassword, 'user_email': userInfo.user_email ,'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'update_type': 'password'});
          if(response != null){
            if(response.code==1) showNotification(this.props.navigator, 1, 'Password changed');
            else showNotification(this.props.navigator, response.code, 'Could not change password');
          }
        } else showNotification(this.props.navigator, 0, 'New Password does not match');
      } else showNotification(this.props.navigator,0,'Incorrect current password');
    }
  }

  onAccessoryPress(value) {
    if(value==0) this.setState({ secureTextEntry: !this.state.secureTextEntry });
    else if(value==1) this.setState({ nsecureTextEntry: !this.state.nsecureTextEntry });
    else this.setState({ csecureTextEntry: !this.state.csecureTextEntry });
  }

  renderPasswordAccessory(value) {
    let { secureTextEntry, nsecureTextEntry, csecureTextEntry } = this.state;

    let entry = null;
    if(value==0) entry = secureTextEntry;
    else if(value==1) entry = nsecureTextEntry;
    else entry=csecureTextEntry;

    let name = entry?
      'visibility':
      'visibility-off';

    return (
      <MaterialIcon
        size={24}
        name={name}
        color={'white'}
        onPress={() => this.onAccessoryPress(value)}
        suppressHighlighting
      />
    );
  }

  onSubmitPassword() {
    this.setState({verticalOffset: -0});  //in order to fix keyboard scroll view handling with user interaction
    this.npassword.focus();
  }

  onSubmitNPassword() {
    this.cpassword.focus();
  }

  updateRef(name, ref) {
    this[name] = ref;
  }

	render() {
		return (
			<KeyboardAvoidingView keyboardVerticalOffset={this.state.verticalOffset} behavior="position">
        <View style={styles.container}>
          <View style={styles.userBox}>
            <Text style={styles.titleLabel}>Username:</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.userValueText}>{this.state.username}</Text>
            </View>
          </View>
  				<TextField
          	label="New Username"
          	fontSize={20}
          	textColor="white"
          	baseColor="lightgrey"
          	labelHeight={12}
          	returnKeyType='done'
            autoCapitalize='none'
            animationDuration={150}
            value={this.state.nusername}
            onChangeText={(v) => this.setState({nusername: v})}
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
          <View style={styles.valueContainer}>
          	<Text style={styles.userValueText}>{this.state.email}</Text>
          </View>

          <TextField
            ref={this.passwordRef}
          	label="Current Password"
            onSubmitEditing={this.onSubmitPassword}
          	fontSize={20}
          	textColor="white"
          	baseColor="lightgrey"
          	labelHeight={12}
          	returnKeyType='next'
            autoCapitalize='none'
            secureTextEntry={this.state.secureTextEntry}
            renderAccessory={() => this.renderPasswordAccessory(0)}
            animationDuration={150}
            value={this.state.password}
            onChangeText={(v) => this.setState({password: v})}
            containerStyle={{marginTop:5,marginLeft:15, marginRight: 15}}

          />
          <TextField
            ref={this.npasswordRef}
          	label="New Password"
            onSubmitEditing={this.onSubmitNPassword}
          	fontSize={20}
          	textColor="white"
          	baseColor="lightgrey"
          	labelHeight={12}
          	returnKeyType='next'
            autoCapitalize='none'
            secureTextEntry={this.state.nsecureTextEntry}
            renderAccessory={() => this.renderPasswordAccessory(1)}
            animationDuration={150}
            value={this.state.npassword}
            onChangeText={(v) => this.setState({npassword: v})}
            containerStyle={{marginLeft:15, marginRight: 15}}
          />
          <TextField
            ref={this.cpasswordRef}
          	label="Confirm Password"
          	fontSize={20}
          	textColor="white"
          	baseColor="lightgrey"
          	labelHeight={12}
          	returnKeyType='done'
            autoCapitalize='none'
            secureTextEntry={this.state.csecureTextEntry}
            renderAccessory={() => this.renderPasswordAccessory(2)}
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
      </KeyboardAvoidingView>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 10,
    backgroundColor: '#2f4858'
	},
	prompt: {
		flex: 0,
		alignItems: 'center',
	},
  userBox: {
    flex:0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
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
	valueContainer: {
		flex:0,
		alignItems: 'flex-end',
		marginRight: 10
	},
	userValueText: {
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