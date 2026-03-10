"""
URL configuration for ITS_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from datetime import datetime

def home(request):
    return HttpResponse(f"""
    <html>
    <head>
        <title>GPS Tracking Backend</title>
        <style>
            body {{
                margin:0;
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg,#0f2027,#203a43,#2c5364);
                color:white;
                display:flex;
                align-items:center;
                justify-content:center;
                height:100vh;
            }}
            .card {{
                background: rgba(255,255,255,0.08);
                padding:40px;
                border-radius:16px;
                box-shadow:0 10px 30px rgba(0,0,0,0.4);
                text-align:center;
                backdrop-filter: blur(8px);
                width:420px;
            }}
            h1 {{
                margin-bottom:10px;
                font-size:26px;
            }}
            .status {{
                margin-top:20px;
                padding:12px;
                border-radius:8px;
                background:#1dd1a1;
                color:#003d2e;
                font-weight:bold;
            }}
            .links a {{
                display:block;
                margin-top:15px;
                text-decoration:none;
                padding:10px;
                border-radius:6px;
                background:#54a0ff;
                color:white;
                transition:0.3s;
            }}
            .links a:hover {{
                background:#2e86de;
            }}
            .time {{
                margin-top:15px;
                font-size:13px;
                opacity:0.8;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>GPS_Tracking_Backend</h1>
            <div class="status">Server Running Successfully</div>

            <!--<div class="links">
                <a href="/admin/">Admin Panel</a>
                <a href="/api/">API Root</a>
            </div>-->

            <div class="time">
                Server Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            </div>
        </div>
    </body>
    </html>
    """)

urlpatterns = [
    # The Home page is a simple HTML page that confirms the server is running.
    # Hit in the post man to see the api endpoints are working or not
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('safety/', include('safety_app.urls')),
]