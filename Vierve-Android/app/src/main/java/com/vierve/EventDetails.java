package com.vierve;

import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.text.Html;
import android.webkit.WebView;
import android.widget.TextView;

import com.google.android.gms.common.images.WebImage;
import com.google.android.gms.vision.text.Text;

public class EventDetails extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_event_details);

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        WebView text = (WebView) findViewById(R.id.text);
        text.loadData(bundle.getString("html"), "text/html; charset=utf-8", "UTF-8");
        //this.getWindow().setLayout((int) (this.getResources().getDisplayMetrics().widthPixels * .70), (int) (this.getResources().getDisplayMetrics().heightPixels*.70));
        getWindow().setBackgroundDrawable(new ColorDrawable(android.graphics.Color.TRANSPARENT));

    }
}
