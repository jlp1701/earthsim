'use strict';

    import { OrbitControls } from './js/examples/jsm/controls/OrbitControls.js';
    import { LineCurve3, Vector3 } from './js/build/three.module.js';
    import { RectAreaLightHelper } from './js/examples/jsm/helpers/RectAreaLightHelper.js';

    let wndHeight = 400;
    let wndWidth = 400;

    let scene = new THREE.Scene();
    scene.background = new THREE.Color("black" );
    let camera = new THREE.PerspectiveCamera( 75, wndWidth/wndHeight, 0.1, 3000 );
    camera.position.set(0,0,0);

    let renderer = new THREE.WebGLRenderer();
    renderer.setSize( wndWidth, wndHeight );
    document.getElementById("ID_DIV_ANI").appendChild( renderer.domElement );

 

    // variables
    let posLong = 0;
    let posLat = 50;
    let rotEnabled = false;

    // set default values of input fields
    let tbLat = document.getElementById('ID_TB_LAT');
    tbLat.onchange = posChanged;
    tbLat.value = posLat;
    let tbLong = document.getElementById('ID_TB_LONG');
    tbLong.onchange = posChanged;
    tbLong.value = posLong;
    let checkBoxRot = document.getElementById('ID_CHECK_ROT');
    checkBoxRot.onchange = posChanged;
    checkBoxRot.checked = rotEnabled;


    let heightPerc = Math.sin(posLat*Math.PI/180);  // defines the relative latitudinal height of the spectator
    let merOffset = Math.sin(posLong);
    let sphRadius = 100;
    let eclipticAngle = 23.43*Math.PI/180;  // 23.43 degrees 
    let earthSunDist = 400;
    let earthSunAngle = 0;
    let rotIncrement = 0.005;

    let dA = 0.00001;

    // create daylength chart
    let daylengthData = calcDayLengthData(posLat, eclipticAngle, 365); 
    let chartDaylength = createChart(daylengthData);

    // enable mouse controls
    let controls = new OrbitControls( camera, renderer.domElement );
    //controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    //controls.dampingFactor = 0.05;
    //controls.screenSpacePanning = false;
    controls.minDistance = sphRadius;
    controls.maxDistance = 50*sphRadius;
    //controls.maxPolarAngle = Math.PI / 2;
    //controls.enablePan = false;
    //controls.minAzimuthAngle = 0;
    //controls.maxAzimuthAngle = 0;
    
    let geometry = new THREE.BufferGeometry();
    let vertices = [];
    let x,y,z;
    let i = 0;
    for (i = 0; i < 10000; i++ ) {
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
    let particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0x888888 } ) );
    scene.add( particles );

    // add sun light
	let dirLight = new THREE.DirectionalLight( 0xffffff );
    //let light = new THREE.RectAreaLight(0xFFFFFF, 1, 100, 100);
    dirLight.position.set( 0, 0, 0);
    dirLight.lookAt(0,0,0);
    let rectLightHelper = new RectAreaLightHelper( dirLight );
    
    
    dirLight.add( rectLightHelper );
    scene.add( dirLight );

    let ambLight = new THREE.AmbientLight( 0x222222 );
    scene.add( ambLight );

    let earth = createEarth(sphRadius, heightPerc);

    earth.sphereGroup.translateX(earthSunDist);
    // rotate sphere axis
    earth.sphereGroup.rotation.z = eclipticAngle;

    // add coordinate helper
    let sphOrigin = new THREE.SphereGeometry(10, 128, 128 );
    let originMat = new THREE.MeshPhongMaterial(  );
    let originMesh = new THREE.Mesh( sphOrigin, originMat );
    scene.add(originMesh);

    // draw axis arrows
    let materialX = new THREE.LineBasicMaterial( { color: 0xFF0000 } );
    let geometryX = new THREE.Geometry();
    geometryX.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometryX.vertices.push(new THREE.Vector3( 100, 0, 0) );
    let XAxis = new THREE.Line( geometryX, materialX );
    scene.add(XAxis);

    let materialY = new THREE.LineBasicMaterial( { color: 0x00FF00 } );
    let geometryY = new THREE.Geometry();
    geometryY.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometryY.vertices.push(new THREE.Vector3( 0, 100, 0) );
    let YAxis = new THREE.Line( geometryY, materialY );
    scene.add(YAxis);

    let materialZ = new THREE.LineBasicMaterial( { color: 0x0000FF } );
    let geometryZ = new THREE.Geometry();
    geometryZ.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometryZ.vertices.push(new THREE.Vector3( 0, 0, 100) );
    let ZAxis = new THREE.Line( geometryZ, materialZ );
    scene.add(ZAxis);

    scene.add(earth.sphereGroup);
                
    //camera.position.z = 3*sphRadius;
    let e = 0;
    let a = 0;
    let animate = function () {
        requestAnimationFrame( animate );
        
        if (rotEnabled) {
            // calculate position of earth
            earthSunAngle += rotIncrement;
        }

        if (earthSunAngle > 2*Math.PI){
            earthSunAngle %= 2*Math.PI;
        }
        earth.sphereGroup.position.x = Math.cos(earthSunAngle)*earthSunDist;
        earth.sphereGroup.position.z = Math.sin(earthSunAngle)*earthSunDist;


        // calculate the angle
        e = Math.cos(earthSunAngle) * eclipticAngle *-1;
        if (Math.abs(e) >= 0) {
            let asin = Math.tan(posLat*Math.PI/180) * Math.tan(e);
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
            //curveLine.geometry = generateCurveGeo(heightPerc*sphRadius, sphRadius,a, Math.PI-a);
            //curveLine.geometry.rotateX(Math.PI/2);
            //curveLine.geometry.translate(0,heightPerc*sphRadius,0);
            earth.updateCurveLine(heightPerc, a);
            //meridianGroup.rotation.y = -earthSunAngle - Math.PI/2;
            //earth.rotation.y = -earthSunAngle - posLong;
            earth.rotate(-earthSunAngle);
        }
        
        // lock on camera to earth
        camera.lookAt(earth.sphereGroup.position);
        
        // change light direction
        dirLight.target = earth.sphereGroup;
        
        updateChartCurrentDay(chartDaylength, (earthSunAngle+3*Math.PI/2));

        //controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
        renderer.render( scene, camera );
    };

    animate();
            
function createEarth(radius, heightPerc) {
    let rotOffset = 3.14;  // 3.14
    // add earth
    let sphEarth = new THREE.SphereGeometry(radius, 128, 128 );
    let earthMat = new THREE.MeshPhongMaterial(  );
    earthMat.map = new THREE.TextureLoader().load("res/earth_atmos_2048.jpg");
    sphEarth.rotateY(rotOffset);
    let earthMesh = new THREE.Mesh( sphEarth, earthMat );

    // create equator
    let equGeo = generateCurveGeo(0, radius);
    equGeo.rotateX(Math.PI/2);
    let equMat = new THREE.MeshBasicMaterial( { color : 0x00FF00 } );
    // Create the final object to add to the scene
    let equMesh = new THREE.Mesh( equGeo, equMat );
    
    // add meridian 0,180 degrees
    let merGeo = generateCurveGeo(0, radius);
    let merMat = new THREE.MeshBasicMaterial( { color : 0x00FF00 } );
    let merLine = new THREE.Mesh( merGeo, merMat );

    // add meridian -90,90 degrees
    let merGeo2 = generateCurveGeo(0, radius);
    merGeo.rotateY(Math.PI/2);
    let merLine2 = new THREE.Mesh( merGeo2, equMat );
    // Create the final object to add to the scene
    
    // create curve
    let curveGeo = generateCurveGeo(heightPerc*radius, radius);
    curveGeo.rotateX(Math.PI/2);
    curveGeo.translate(0,heightPerc*radius,0);
    let curveMat = new THREE.MeshBasicMaterial( { color : 0xFFFF00 } );
    // Create the final object to add to the scene
    let curveLine = new THREE.Mesh( curveGeo, curveMat );
            
    // sphere axis
    let materialAxis = new THREE.LineBasicMaterial( { color: 0xFFFFFF } );
    let geometryAxis = new THREE.Geometry();
    geometryAxis.vertices.push(new THREE.Vector3( 0, -2*radius, 0) );
    geometryAxis.vertices.push(new THREE.Vector3( 0, 2*radius, 0) );
    let poleAxis = new THREE.Line( geometryAxis, materialAxis );
    
    let meridianGroup = new THREE.Group();
    meridianGroup.add(poleAxis);
    meridianGroup.add(equMesh);
    meridianGroup.add(merLine);
    meridianGroup.add(merLine);
    meridianGroup.add(merLine2);
    meridianGroup.add(curveLine);
    meridianGroup.rotateY(-Math.PI/2);

    // group sphere and line
    let sphereGroup = new THREE.Group();
    sphereGroup.add(earthMesh);
    sphereGroup.add(meridianGroup);

    let earth = {};
    earth.sphereGroup = sphereGroup;
    earth.rotate = function (angle) {
        meridianGroup.rotation.y = angle - Math.PI/2;
        earthMesh.rotation.y = angle;
    };
    earth.updateCurveLine = function (heightPerc, a) {
        curveLine.geometry = generateCurveGeo(heightPerc*sphRadius, sphRadius,a, Math.PI-a);
        curveLine.geometry.rotateX(Math.PI/2);
        curveLine.geometry.translate(0,heightPerc*sphRadius,0);
    };
    return earth;    
}

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
        let t = angleEnd;
        angleEnd = angleStart;
        angleStart = t;
    }
    // create curve
    let curveRadius = calcCurveRadius(height, totalHeight);
    //let curve = new THREE.EllipseCurve(0,0, curveRadius, curveRadius, angle, Math.PI-angle,false,0);
    let curvePath = createCurvePath(curveRadius, 150, angleStart, angleEnd);
    let curveGeo = new THREE.TubeGeometry(curvePath,32, 1, 8, false);
    //curveGeo.rotateX(Math.PI/2);
    //curveGeo.translate(0,height,0);
    return curveGeo;
}

function createCurvePath(radius, sections, angleStart, angleEnd){
    let i = 0;
    let path = new THREE.CurvePath();
    let secAngle = (angleEnd-angleStart)/sections;
    let secAngleStart = angleStart;
    let secAngleEnd = secAngleStart + secAngle;
    for (i = 0; i < sections; i++){
        let v0 = new Vector3(radius*Math.cos(secAngleStart), radius*Math.sin(secAngleStart), 0);
        let v1 = new Vector3(radius*Math.cos((secAngleEnd - secAngleStart)/2), radius*Math.sin((secAngleEnd - secAngleStart)/2), 0);
        let v2 = new Vector3(radius*Math.cos(secAngleEnd), radius*Math.sin(secAngleEnd), 0);
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
    let asin = Math.tan(lat*Math.PI/180)*Math.tan(ecliptic);
    if (asin > 1.0){
        asin = 1.0;
    }
    if (asin < -1.0){
        asin = -1.0;
    }
    let alpha = Math.asin(asin);
    let relativeLength = (Math.PI-2*alpha)/Math.PI;
    return relativeLength*12;
}

function calcDayLengthData(lat, maxEcliptic, numberOfPoints) {
    let i = 0;
    let angleInc = 2*Math.PI/numberOfPoints;
    let dayInc = numberOfPoints/365;
    let data = [];
    for (i = 0; i < numberOfPoints; i++){
        let angle = i*angleInc;
        let ecliptic = maxEcliptic*Math.sin(angle);
        data.push({x: i*dayInc, y: calcDayLength(lat, ecliptic)});
    }
    return data;
}

function createChart(myData){
    let ctx = document.getElementById('myChart');
    //ctx.width = window.innerWidth;
    let myChart = new Chart.Scatter(ctx, {
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
    let oldData = chart.data.datasets[0];
    oldData.data = data;
    chart.update();
}

function updateChartCurrentDay(chart, angle){
    if (angle > 2*Math.PI){
        angle %= 2*Math.PI;
    }
    let day = angle/2/Math.PI*365;
    chart.data.datasets[1].data = [{x: day, y:0}, {x:day, y:24}];
    chart.update();
}