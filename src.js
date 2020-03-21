    import { OrbitControls } from './js/examples/jsm/controls/OrbitControls.js';
    import { LineCurve3, Vector3 } from './js/build/three.module.js';
import { RectAreaLightHelper } from './js/examples/jsm/helpers/RectAreaLightHelper.js';

    var wndHeight = 400;
    var wndWidth = 400;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color("black" );
    var camera = new THREE.PerspectiveCamera( 75, wndWidth/wndHeight, 0.1, 3000 );
    camera.position.set(0,0,0);

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( wndWidth, wndHeight );
    document.getElementById("ID_DIV_ANI").appendChild( renderer.domElement );

 

    // variables
    var posLong = 0;
    var posLat = 50;
    var rotEnabled = true;

    // set default values of input fields
    var tbLat = document.getElementById('ID_TB_LAT');
    tbLat.onchange = posChanged;
    tbLat.value = posLat;
    var tbLong = document.getElementById('ID_TB_LONG');
    tbLong.onchange = posChanged;
    tbLong.value = posLong;
    var checkBoxRot = document.getElementById('ID_CHECK_ROT');
    checkBoxRot.onchange = posChanged;
    checkBoxRot.checked = rotEnabled;


    var heightPerc = Math.sin(posLat*Math.PI/180);  // defines the relative latitudinal height of the spectator
    var merOffset = Math.sin(posLong);
    var sphRadius = 100;
    var eclipticAngle = 23.43*Math.PI/180;  // 23.4 degrees 
    var earthSunDist = 400;
    var earthSunAngle = 0;
    var rotIncrement = 0.005;
    var rotOffset = -3.14;
    var dA = 0.00001;

    // create daylength chart
    var daylengthData = calcDayLengthData(posLat, eclipticAngle, 365); 
    var chartDaylength = createChart(daylengthData);

    // enable mouse controls
    var controls = new OrbitControls( camera, renderer.domElement );
    //controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    //controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = sphRadius;
    controls.maxDistance = 50*sphRadius;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = false;
    //controls.minAzimuthAngle = 0;
    //controls.maxAzimuthAngle = 0;
    
    var geometry = new THREE.BufferGeometry();
    var vertices = [];
    var x,y,z;
    for ( var i = 0; i < 10000; i ++ ) {
        x = THREE.Math.randFloatSpread( 2000 );
        y = THREE.Math.randFloatSpread( 2000 );
        z = THREE.Math.randFloatSpread( 2000 );
        if (Math.abs(x) > 700 || Math.abs(y) > 700 || Math.abs(z) > 700) {
            vertices.push(x);
            vertices.push(y);
            vertices.push(z);    
        }
    }
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    var particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0x888888 } ) );
    scene.add( particles );

    // add sun light
	var dirLight = new THREE.DirectionalLight( 0xffffff );
    //var light = new THREE.RectAreaLight(0xFFFFFF, 1, 100, 100);
    dirLight.position.set( 0, 0, 0);
    dirLight.lookAt(0,0,0);
    var rectLightHelper = new RectAreaLightHelper( dirLight );
    
    
    dirLight.add( rectLightHelper );
    scene.add( dirLight );

    var ambLight = new THREE.AmbientLight( 0x222222 );
    scene.add( ambLight );

    // add earth
    var sphEarth = new THREE.SphereGeometry( sphRadius, 128, 128 );
    var earthMat = new THREE.MeshPhongMaterial(  );
    earthMat.map    = new THREE.TextureLoader().load("res/earth_atmos_2048.jpg");
    sphEarth.rotateY(rotOffset);
    var earth = new THREE.Mesh( sphEarth, earthMat );

    // create equator
    var equGeo;
    equGeo = generateCurveGeo(0, sphRadius);
    equGeo.rotateX(Math.PI/2);
    var equMat = new THREE.MeshBasicMaterial( { color : 0x00FF00 } );
    // Create the final object to add to the scene
    var equMesh = new THREE.Mesh( equGeo, equMat );
    
    // add meridian 0,180 degrees
    var merGeo = generateCurveGeo(0, sphRadius);
    var merMat = new THREE.MeshBasicMaterial( { color : 0x00FF00 } );
    var merLine = new THREE.Mesh( merGeo, merMat );

    // add meridian -90,90 degrees
    var merGeo2 = generateCurveGeo(0, sphRadius);
    merGeo.rotateY(Math.PI/2);
    var merLine2 = new THREE.Mesh( merGeo2, equMat );
    // Create the final object to add to the scene


    // create curve
    var curveGeo = generateCurveGeo(heightPerc*sphRadius, sphRadius);
    curveGeo.rotateX(Math.PI/2);
    curveGeo.translate(0,heightPerc*sphRadius,0);
    var curveMat = new THREE.MeshBasicMaterial( { color : 0xFFFF00 } );
    // Create the final object to add to the scene
    var curveLine = new THREE.Mesh( curveGeo, curveMat );
            
    
    // sphere axis
    var materialAxis = new THREE.LineBasicMaterial( { color: 0xFFFFFF } );
    var geometryAxis = new THREE.Geometry();
    geometryAxis.vertices.push(new THREE.Vector3( 0, -2*sphRadius, 0) );
    geometryAxis.vertices.push(new THREE.Vector3( 0, 2*sphRadius, 0) );
    var poleAxis = new THREE.Line( geometryAxis, materialAxis );
    
    var meridianGroup = new THREE.Group();
    meridianGroup.add(poleAxis);
    meridianGroup.add(equMesh);
    meridianGroup.add(merLine);
    meridianGroup.add(merLine);
    meridianGroup.add(merLine2);
    meridianGroup.add(curveLine);
    meridianGroup.rotateY(-Math.PI/2);

    // group sphere and line
    var sphereGroup = new THREE.Group();
    sphereGroup.add(earth);
    sphereGroup.add(meridianGroup);

    sphereGroup.translateX(earthSunDist);
    // rotate sphere axis
    sphereGroup.rotation.z = eclipticAngle;

    scene.add(sphereGroup);
                
    //camera.position.z = 3*sphRadius;
    var e = 0;
    var a = 0;
    var animate = function () {
        requestAnimationFrame( animate );
        
        if (rotEnabled) {
            // calculate position of earth
            earthSunAngle += rotIncrement;
        }

        if (earthSunAngle > 2*Math.PI){
            earthSunAngle %= 2*Math.PI;
        }
        sphereGroup.position.x = Math.cos(earthSunAngle)*earthSunDist;
        sphereGroup.position.z = Math.sin(earthSunAngle)*earthSunDist;


        // calculate the angle
        e = Math.cos(earthSunAngle) * eclipticAngle *-1;
        if (Math.abs(e) >= 0)
        var asin = Math.tan(posLat*Math.PI/180) * Math.tan(e);
        if (asin < -1.0){
            asin = -1.0;
        }
        if (asin > 1.0){
            asin = 1.0;
        }
        a = Math.asin(asin);
        if (isNaN(a)) {
            console.warn("a = NAN" + a);
        }
        curveLine.geometry = generateCurveGeo(heightPerc*sphRadius, sphRadius,a, Math.PI-a);
        curveLine.geometry.rotateX(Math.PI/2);
        curveLine.geometry.translate(0,heightPerc*sphRadius,0);
        meridianGroup.rotation.y = -earthSunAngle - Math.PI/2;
        earth.rotation.y = -earthSunAngle - posLong;

        // lock on camera to earth
        camera.lookAt(sphereGroup.position);
        
        // change light direction
        dirLight.target =sphereGroup;
        
        updateChartCurrentDay(chartDaylength, (earthSunAngle+3*Math.PI/2));

        //controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
        renderer.render( scene, camera );
    };

    animate();
            
function calcCurveRadius(height, totalHeight){
    return Math.sqrt(totalHeight*totalHeight - height*height);
}

function normAngle(a){
    if (Math.abs(a) > 2*Math.PI){
        a %= 2*Math.PI;
    }
    return a;
}

function generateCurveGeo(height, totalHeight, angleStart=0, angleEnd=2*Math.PI){
    angleStart = normAngle(angleStart);
    angleEnd = normAngle(angleEnd);
    if (angleStart > angleEnd){
        var t = angleEnd;
        angleEnd = angleStart;
        angleStart = angleEnd;
    }
    // create curve
    var curveRadius = calcCurveRadius(height, totalHeight);
    //var curve = new THREE.EllipseCurve(0,0, curveRadius, curveRadius, angle, Math.PI-angle,false,0);
    var curvePath = createCurvePath(curveRadius, 150, angleStart, angleEnd);
    var curveGeo = new THREE.TubeGeometry(curvePath,32, 1, 8, false);
    //curveGeo.rotateX(Math.PI/2);
    //curveGeo.translate(0,height,0);
    return curveGeo;
}

function createCurvePath(radius, sections, angleStart, angleEnd){
    var i = 0;
    var path = new THREE.CurvePath();
    var secAngle = (angleEnd-angleStart)/sections;
    var secAngleStart = angleStart;
    var secAngleEnd = secAngleStart + secAngle;
    for (i = 0; i < sections; i++){
        var v0 = new Vector3(radius*Math.cos(secAngleStart), radius*Math.sin(secAngleStart), 0);
        var v1 = new Vector3(radius*Math.cos((secAngleEnd - secAngleStart)/2), radius*Math.sin((secAngleEnd - secAngleStart)/2), 0);
        var v2 = new Vector3(radius*Math.cos(secAngleEnd), radius*Math.sin(secAngleEnd), 0);
        path.add(new LineCurve3(v0, v2));
        secAngleStart = secAngleEnd;
        secAngleEnd += secAngle;
    }
    return path;
}

function posChanged(a){
    // if (tbLat.value > 90){
    //     tbLat.value = 90;
    // } 
    // if (tbLat.value < -90){
    //     tbLat.value = -90;
    // }
    posLat = tbLat.value;
    posLong = tbLong.value*Math.PI/180;
    console.debug("posLat: " + posLat);
    heightPerc = Math.sin(posLat*Math.PI/180);  // defines the relative latitudinal height of the spectator
    merOffset = Math.sin(posLong);
    
    rotEnabled = checkBoxRot.checked;


    updateChartData(chartDaylength, calcDayLengthData(posLat, eclipticAngle, 365));
}

function calcDayLength(lat, ecliptic){
    var asin = Math.tan(lat*Math.PI/180)*Math.tan(ecliptic);
    if (asin > 1.0){
        asin = 1.0;
    }
    if (asin < -1.0){
        asin = -1.0;
    }
    var alpha = Math.asin(asin);
    var relativeLength = (Math.PI-2*alpha)/Math.PI;
    return relativeLength*12;
}

function calcDayLengthData(lat, maxEcliptic, numberOfPoints) {
    var i = 0;
    var angleInc = 2*Math.PI/numberOfPoints;
    var dayInc = numberOfPoints/365;
    var data = [];
    for (i = 0; i < numberOfPoints; i++){
        var angle = i*angleInc;
        var ecliptic = maxEcliptic*Math.sin(angle);
        data.push({x: i*dayInc, y: calcDayLength(lat, ecliptic)});
    }
    return data;
}

function createChart(myData){
    var ctx = document.getElementById('myChart');
    //ctx.width = window.innerWidth;
    var myChart = new Chart.Scatter(ctx, {
        //type: 'bar',
        data: {
            datasets: [{
                label: 'Daylength [h]',
                data: myData,
                type: 'scatter',
                showLine: true,
                fill: false,
            },
            {
                label: 'currentDay',
                data: [{x:180, y:0}, {x:180, y:24}],
                type: 'line',
                showLine: true,
                borderColor: 'blue'
            }]
        },
        options: {  
            scales: {
                xAxes: [{
                        display: true,
                        ticks: {
                            beginAtZero: true,
                            steps: 12,
                            stepSize: 365/12,
                            max: 365
                        }
                    }],
                yAxes: [{
                        display: true,
                        stacked: true,
                        ticks: {
                            beginAtZero: true,
                            steps: 12,
                            stepSize: 2,
                            max: 24
                        }
                    }]
            },
            animation: false
          }
    });
    return myChart;
    }

function updateChartData(chart, data) {
    // delete old data
    var oldData = chart.data.datasets[0];
    oldData.data = data;
    chart.update();
}

function updateChartCurrentDay(chart, angle){
    if (angle > 2*Math.PI){
        angle %= 2*Math.PI;
    }
    var day = angle/2/Math.PI*365;
    chart.data.datasets[1].data = [{x: day, y:0}, {x:day, y:24}];
    chart.update();
}