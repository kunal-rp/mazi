import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, TouchableOpacity, Image } from 'react-native';
import { TextField } from 'react-native-material-textfield';
import CheckBox from 'react-native-modest-checkbox'
import Db_Helper_User from '../utils/Db_Helper_User';
import ServerTools from '../utils/ServerTools';
import {showNotification} from '../utils/Toolbox';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

class LoginScreen extends Component{
	static navigatorStyle = {
		navBarHidden: true,
  	screenBackgroundColor: '#2f4858',
		statusBarColor: '#2f4858'
	};

	constructor(props) {
    super(props);
    this.state = {
    	text: '',
    	username: '',
    	password: '',
    	remember: true,
  	};
  	this.AttemptSignIn = this.AttemptSignIn.bind(this);
  	this.onSubmitUsername = this.onSubmitUsername.bind(this);
  	this.onAccessoryPress = this.onAccessoryPress.bind(this);
  	this.renderPasswordAccessory = this.renderPasswordAccessory.bind(this);

  	//refs
  	this.usernameRef = this.updateRef.bind(this, 'username');
  	this.passwordRef = this.updateRef.bind(this, 'password');
	}

	async loadInfo() {
		var userInfo = await Db_Helper_User.getInfo();
		if (userInfo != null){
			this.setState({
				username: userInfo.user_name,
				password: userInfo.user_password,
				remember: userInfo.remember,
				secureTextEntry: true,
			});
		}
	}

	componentDidMount() {
		this.loadInfo();
	}

	async AttemptSignIn() {
		var code = await ServerTools.getCode(); //get server general code
		let response = await ServerTools.login({'token_gen': code, 'user_name': this.state.username, 'user_password': this.state.password}); //login using json object
		if(response != null){
			if(response.code==1){
				Db_Helper_User.saveSessionData({'token_gen': code, 'token_user':response.data.token, 'user_id': response.data.user_id});	//store credentials in local storage
				if(this.state.remember) Db_Helper_User.updateUserCredentials({'user_name': this.state.username, 'user_password': this.state.password, 'remember': this.state.remember});
				else Db_Helper_User.updateUserCredentials({'user_name': '', 'user_password': '', 'remember': false});

				//push main screen
				this.props.navigator.push({
					screen: 'vt.MainScreen',
					backButtonHidden: true,
				});
			}
			if(response.code==0 || response.code==-1){	//show error notification if invalid
				showNotification(this.props.navigator, 0, response.message);
			}
		}
	}

	pushRegisterScreen = () => {
		this.props.navigator.push({
			screen: 'vt.RegisterScreen',
			title: 'Register Account',
			backButtonTitle: '',
		});
	};
	pushForgotUsername = () => {
		this.props.navigator.push({
			screen: 'vt.ForgotUsername',
			title: 'Forgot Your Username',
			backButtonTitle: '',
		});
	}
	pushForgotPassword = () => {
		this.props.navigator.push({
			screen: 'vt.ForgotPassword',
			title: 'Reset Your Password',
			backButtonTitle: '',
		});
	}

	onAccessoryPress() {
    this.setState({ secureTextEntry: !this.state.secureTextEntry });
  }

  renderPasswordAccessory() {
    let { secureTextEntry } = this.state;
    let name = secureTextEntry?
      'visibility':
      'visibility-off';

    return (
      <MaterialIcon
        size={24}
        name={name}
        color={'white'}
        onPress={this.onAccessoryPress}
        suppressHighlighting
      />
    );
  }

	onSubmitUsername() {
		this.password.focus();
	}

	updateRef(name, ref) {
    this[name] = ref;
  }

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.imageViewContainer}>
					<Text style={styles.logotext}>Vierve</Text>
					<Image
						style={styles.image}
						source={require('../res/vierve_logo.png')}
					/>
					<Text style={styles.banner}>College Parking made Simple</Text>
				</View>
        <View style={{margin: 8}}>
	        <TextField
	        	ref={this.usernameRef}
	        	onSubmitEditing={this.onSubmitUsername}
	        	label='Username'
	        	fontSize={18}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
	        	autoCapitalize='none'
	        	value={this.state.username}
	        	onChangeText={(v) => this.setState({username: v})}
	        	animationDuration={150}
	        />
	        <TouchableOpacity onPress={this.pushForgotUsername}>
		        <View style={styles.smallTextButton}>
		        	<Text style={styles.forgotText}>Forgot username?</Text>
		        </View>
	        </TouchableOpacity>
	        <TextField
	        	ref={this.passwordRef}
	        	label="Password"
	        	fontSize={18}
	        	value={this.state.password}
	        	onChangeText={(v) => this.setState({password: v})}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='done'
	        	secureTextEntry={this.state.secureTextEntry}
	        	renderAccessory={this.renderPasswordAccessory}
            autoCapitalize='none'
            animationDuration={150}
	        />
	        <TouchableOpacity onPress={this.pushForgotPassword}>
	        	<View style={styles.smallTextButton}>
	        		<Text style={styles.forgotText}>Forgot password?</Text>
	        	</View>
	        </TouchableOpacity>
	        <View style={styles.checkboxSection}>
	        	<CheckBox
	        		checkboxStyle={{tintColor:'white'}}
	        		labelStyle={{color:'white'}}
	        		label='Remember Me'
	        		checked={this.state.remember}
	        		onChange={(v) => this.setState({remember: v.checked})}
	        	/>
	        </View>
        </View>
        <View style={styles.buttonContainer}>
		    	<TouchableHighlight onPress={this.AttemptSignIn} underlayColor='#2f4858'>
			    	<View style={styles.signinbutton}>
			    		<Text style={styles.buttonText}>SIGN IN</Text>
			    	</View>
			    </TouchableHighlight>
		    	<TouchableHighlight style={{marginLeft: 10, marginRight: 10}} onPress={this.pushRegisterScreen} underlayColor='white'>
			    	<View style={styles.registerbutton}>
			    		<Text style={styles.buttonText}>REGISTER</Text>
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
	imageViewContainer: {
		alignItems: 'center'
	},
	logotext: {
		fontSize: 30,
		color: 'white',
		paddingBottom: 5
	},
	banner: {
		fontSize: 14,
		color: 'white',
		fontStyle: 'italic',
		paddingBottom: 5
	},
	image: {
    width: 170,
    height: 150,
    marginBottom: 5
  },
  smallTextButton: {
  	flex: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  forgotText: {
		fontSize: 14,
    color: 'white'
  },
  buttonContainer:{
  	marginTop: 10,
  },
  signinbutton: {
  	marginBottom: 10,
  	marginLeft: 10,
  	marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#2196F3'
  },
  registerbutton: {
    alignItems: 'center',
    backgroundColor: '#2f4858'
  },
  buttonText: {
		padding: 15,
    color: 'white'
  },
  checkboxSection:{
  	flex: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 5
  }
});

export default LoginScreen;