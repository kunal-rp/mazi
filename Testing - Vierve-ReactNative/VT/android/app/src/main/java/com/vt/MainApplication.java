package com.vt;

import com.reactnativenavigation.NavigationApplication;
import com.facebook.react.ReactPackage;
import com.airbnb.android.react.maps.MapsPackage;
import com.oblador.vectoricons.VectorIconsPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends NavigationApplication {
 @Override
 public boolean isDebug() {
     // Make sure you are using BuildConfig from your own application
     return BuildConfig.DEBUG;
 }

 protected List<ReactPackage> getPackages() {
     // Add additional packages you require here
     // No need to add RnnPackage and MainReactPackage
     return Arrays.<ReactPackage>asList(
        	new VectorIconsPackage(),
        	new MapsPackage()
     );
 }

 @Override
 public List<ReactPackage> createAdditionalReactPackages() {
 		return Arrays.<ReactPackage>asList(
        	new VectorIconsPackage(),
        	new MapsPackage()
     );
    // return getPackages();
 }
}
