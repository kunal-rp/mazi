export function showNotification(navigator, type, message){
	navigator.showInAppNotification({
		screen: 'vt.Notification',
		passProps: {type: type, message: message}
	});
}