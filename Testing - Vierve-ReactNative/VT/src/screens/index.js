import {Navigation} from 'react-native-navigation';

//Screens
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ForgotUsername from './ForgotUsername';
import ForgotPassword from './ForgotPassword';
import MainScreen from './MainScreen';
import ProfileScreen from './ProfileScreen';
import BugReportScreen from './BugReportScreen';
import CustomTopBar from './CustomTopBar';
import MatchTopBar from './MatchTopBar';
import WaitingScreen from './WaitingScreen';
import MatchScreen from './MatchScreen';
import CancelLightBox from './components/CancelLightBox';
import RatingScreen from './RatingScreen';
import Notification from './types/Notification';

// register all screens of the app (including internal ones)
export function registerScreens() {
	Navigation.registerComponent('vt.LoginScreen', () => LoginScreen);
	Navigation.registerComponent('vt.RegisterScreen', () => RegisterScreen);
	Navigation.registerComponent('vt.ForgotUsername', () => ForgotUsername);
	Navigation.registerComponent('vt.ForgotPassword', () => ForgotPassword);
	Navigation.registerComponent('vt.MainScreen', () => MainScreen);
	Navigation.registerComponent('vt.ProfileScreen', () => ProfileScreen);
	Navigation.registerComponent('vt.BugReportScreen', () => BugReportScreen);
	Navigation.registerComponent('vt.CustomTopBar',() => CustomTopBar);
	Navigation.registerComponent('vt.WaitingScreen', () => WaitingScreen);
	Navigation.registerComponent('vt.MatchScreen', () => MatchScreen);
	Navigation.registerComponent('vt.MatchTopBar', () => MatchTopBar);
	Navigation.registerComponent('vt.CancelLightBox', () => CancelLightBox);
	Navigation.registerComponent('vt.RatingScreen', () => RatingScreen);
	Navigation.registerComponent('vt.Notification', () => Notification);
}