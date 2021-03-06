/// <reference path="_reference.ts"/>
// MAIN GAME FILE
// THREEJS Aliases
var Scene = Physijs.Scene;
var Renderer = THREE.WebGLRenderer;
var PerspectiveCamera = THREE.PerspectiveCamera;
var BoxGeometry = THREE.BoxGeometry;
var CubeGeometry = THREE.CubeGeometry;
var PlaneGeometry = THREE.PlaneGeometry;
var SphereGeometry = THREE.SphereGeometry;
var Geometry = THREE.Geometry;
var AxisHelper = THREE.AxisHelper;
var LambertMaterial = THREE.MeshLambertMaterial;
var MeshBasicMaterial = THREE.MeshBasicMaterial;
var LineBasicMaterial = THREE.LineBasicMaterial;
var Material = THREE.Material;
var Line = THREE.Line;
var Mesh = THREE.Mesh;
var Object3D = THREE.Object3D;
var SpotLight = THREE.SpotLight;
var PointLight = THREE.PointLight;
var AmbientLight = THREE.AmbientLight;
var Control = objects.Control;
var GUI = dat.GUI;
var Color = THREE.Color;
var Vector3 = THREE.Vector3;
var Face3 = THREE.Face3;
var Point = objects.Point;
var CScreen = config.Screen;
var Clock = THREE.Clock;
//trying to pull
//Custom Game Objects
var gameObject = objects.gameObject;
// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";
// setup an IIFE structure (Immediately Invoked Function Expression)
var game = (function () {
    // declare game objects
    var havePointerLock;
    var element;
    var scene = new Scene(); // Instantiate Scene Object
    var renderer;
    var camera;
    var control;
    var gui;
    var stats;
    var blocker;
    var instructions;
    var spotLight;
    var groundGeometry;
    var groundMaterial;
    var ground;
    var clock;
    var playerGeometry;
    var playerMaterial;
    var player;
    var sphereGeometry;
    var sphereMaterial;
    var sphere;
    var keyboardControls;
    var mouseControls;
    var isGrounded;
    var velocity = new Vector3(0, 0, 0);
    var prevTime = 0;
    var directionLineMaterial;
    var directionLineGeometry;
    var directionLine;
    var dead = false;
    //level objects
    //big island
    var bigIsland;
    var bigIslandGeometry;
    var bigIslandMaterial;
    //small island
    var smallIsland;
    var smallIslandGeometry;
    var smallIslandMaterial;
    //board
    var board;
    var boardGeometry;
    var boardMaterial;
    function init() {
        // Create to HTMLElements
        blocker = document.getElementById("blocker");
        instructions = document.getElementById("instructions");
        //check to see if pointerlock is supported
        havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
        // Instantiate Game Controls
        keyboardControls = new objects.KeyboardControls();
        mouseControls = new objects.MouseControls();
        // Check to see if we have pointerLock
        if (havePointerLock) {
            element = document.body;
            instructions.addEventListener('click', function () {
                // Ask the user for pointer lock
                console.log("Requesting PointerLock");
                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;
                element.requestPointerLock();
            });
            document.addEventListener('pointerlockchange', pointerLockChange);
            document.addEventListener('mozpointerlockchange', pointerLockChange);
            document.addEventListener('webkitpointerlockchange', pointerLockChange);
            document.addEventListener('pointerlockerror', pointerLockError);
            document.addEventListener('mozpointerlockerror', pointerLockError);
            document.addEventListener('webkitpointerlockerror', pointerLockError);
        }
        // Scene changes for Physijs
        scene.name = "Main";
        scene.fog = new THREE.Fog(0xffffff, 0, 750);
        scene.setGravity(new THREE.Vector3(0, -10, 0));
        scene.addEventListener('update', function () {
            scene.simulate(undefined, 2);
        });
        // setup a THREE.JS Clock object
        clock = new Clock();
        setupRenderer(); // setup the default renderer
        setupLevel(); //setup level
        // Spot Light
        // spotLight = new SpotLight(0xffffff);
        // spotLight.position.set(20, 40, -15);
        // spotLight.castShadow = true;
        // spotLight.intensity = 2;
        // spotLight.lookAt(new Vector3(0, 0, 0));
        // spotLight.shadowCameraNear = 2;
        // spotLight.shadowCameraFar = 200;
        // spotLight.shadowCameraLeft = -5;
        // spotLight.shadowCameraRight = 5;
        // spotLight.shadowCameraTop = 5;
        // spotLight.shadowCameraBottom = -5;
        // spotLight.shadowMapWidth = 2048;
        // spotLight.shadowMapHeight = 2048;
        // spotLight.shadowDarkness = 0.5;
        // spotLight.name = "Spot Light";
        // scene.add(spotLight);
        // console.log("Added spotLight to scene");
        var light = new THREE.DirectionalLight(0xffffff);
        light.castShadow = true; // soft white light
        light.shadowCameraNear = 2;
        scene.add(light);
        // Player Object
        playerGeometry = new BoxGeometry(2, 2, 2);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 1);
        player.position.set(0, 30, 10);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        scene.add(player);
        console.log("Added Player to Scene");
        // setup the camera
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
        //camera.position.set(0, 5, 0);
        //camera.lookAt(new Vector3(0, 0, 0));
        player.add(camera);
        console.log("Finished setting up Camera...");
        // Collision Check
        player.addEventListener('collision', function (event) {
            if (event.name === "BigIsland") {
                console.log("player hit the big island");
                isGrounded = true;
            }
            if (event.name === "Board") {
                console.log("player hit the board");
                isGrounded = true;
            }
            if (event.name === "Sphere") {
                console.log("player hit the sphere");
            }
        });
        // Add DirectionLine
        directionLineMaterial = new LineBasicMaterial({ color: 0xffff00 });
        directionLineGeometry = new Geometry();
        directionLineGeometry.vertices.push(new Vector3(0, 0, 0)); // line origin
        directionLineGeometry.vertices.push(new Vector3(0, 0, -50)); // end of the line
        directionLine = new Line(directionLineGeometry, directionLineMaterial);
        player.add(directionLine);
        console.log("Added DirectionLine to the Player");
        // Sphere Object
        sphereGeometry = new SphereGeometry(2, 32, 32);
        sphereMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        sphere = new Physijs.SphereMesh(sphereGeometry, sphereMaterial, 1);
        sphere.position.set(0, 60, 5);
        sphere.receiveShadow = true;
        sphere.castShadow = true;
        sphere.name = "Sphere";
        //scene.add(sphere);
        //console.log("Added Sphere to Scene");
        // add controls
        gui = new GUI();
        control = new Control();
        addControl(control);
        // Add framerate stats
        addStatsObject();
        console.log("Added Stats to scene...");
        document.body.appendChild(renderer.domElement);
        gameLoop(); // render the scene	
        scene.simulate();
        window.addEventListener('resize', onWindowResize, false);
    }
    //PointerLockChange Event Handler
    function pointerLockChange(event) {
        if (document.pointerLockElement === element) {
            // enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        }
        else {
            // disable our mouse and keyboard controls
            keyboardControls.enabled = false;
            mouseControls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
            console.log("PointerLock disabled");
        }
    }
    //PointerLockError Event Handler
    function pointerLockError(event) {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }
    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function addControl(controlObject) {
        /* ENTER CODE for the GUI CONTROL HERE */
    }
    // Add Frame Rate Stats to the Scene
    function addStatsObject() {
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
    }
    // Setup main game loop
    function gameLoop() {
        stats.update();
        // if (player.position.y < -5) {
        //     dead = true;
        // }
        // if(dead){
        //     player.position.set(0,3,0);
        //     dead = false;
        // }
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            var time = performance.now();
            var delta = (time - prevTime) / 1000;
            if (isGrounded) {
                var direction = new Vector3(0, 0, 0);
                if (keyboardControls.moveForward) {
                    console.log("Moving Forward");
                    velocity.z -= 400.0 * delta;
                }
                if (keyboardControls.moveLeft) {
                    console.log("Moving left");
                    velocity.x -= 400.0 * delta;
                }
                if (keyboardControls.moveBackward) {
                    console.log("Moving Backward");
                    velocity.z += 400.0 * delta;
                }
                if (keyboardControls.moveRight) {
                    console.log("Moving Right");
                    velocity.x += 400.0 * delta;
                }
                if (keyboardControls.jump) {
                    console.log("Jumping");
                    velocity.y += 4000.0 * delta;
                    if (player.position.y > 4) {
                        isGrounded = false;
                    }
                }
                player.setDamping(0.7, 0.1);
                // Changing player's rotation
                player.setAngularVelocity(new Vector3(0, -mouseControls.yaw, 0));
                direction.addVectors(direction, velocity);
                direction.applyQuaternion(player.quaternion);
                if (Math.abs(player.getLinearVelocity().x) < 20 && Math.abs(player.getLinearVelocity().y) < 10) {
                    player.applyCentralForce(direction);
                }
            } // isGrounded ends
        } // Controls Enabled ends
        else {
            player.setAngularVelocity(new Vector3(0, 0, 0));
        }
        prevTime = time;
        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);
        // render the scene
        renderer.render(scene, camera);
    }
    // Setup default renderer
    function setupRenderer() {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
        console.log("Finished setting up Renderer...");
    }
    // Setup level
    function setupLevel() {
        // Big Island
        bigIslandGeometry = new BoxGeometry(32, 1, 20);
        bigIslandMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xeffffff }), 0, 0);
        bigIsland = new Physijs.ConvexMesh(bigIslandGeometry, bigIslandMaterial, 0);
        bigIsland.position.set(0, 0, 5);
        bigIsland.receiveShadow = true;
        bigIsland.name = "BigIsland";
        scene.add(bigIsland);
        console.log("Added BigIsland to scene");
        // Board
        boardGeometry = new BoxGeometry(32, 1, 5);
        boardMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xeffffff }), 0, 0);
        board = new Physijs.ConvexMesh(boardGeometry, boardMaterial, 0);
        board.position.set(0, 0, -10);
        board.receiveShadow = true;
        board.name = "Board";
        scene.add(board);
        console.log("Added Board to scene");
        // Board
        boardGeometry = new BoxGeometry(32, 1, 5);
        boardMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xeffffff }), 0, 0);
        board = new Physijs.ConvexMesh(boardGeometry, boardMaterial, 0);
        board.position.set(0, 0, -18);
        board.receiveShadow = true;
        board.name = "Board";
        scene.add(board);
        console.log("Added Board to scene");
        // Big Island
        bigIslandGeometry = new BoxGeometry(32, 1, 20);
        bigIslandMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xeffffff }), 0, 0);
        bigIsland = new Physijs.ConvexMesh(bigIslandGeometry, bigIslandMaterial, 0);
        bigIsland.position.set(0, 0, -34);
        bigIsland.receiveShadow = true;
        bigIsland.name = "BigIsland";
        scene.add(bigIsland);
        console.log("Added BigIsland to scene");
        // Small Island
        smallIslandGeometry = new BoxGeometry(10, 1, 10);
        smallIslandMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xeffffff }), 0, 0);
        smallIsland = new Physijs.ConvexMesh(smallIslandGeometry, smallIslandMaterial, 0);
        smallIsland.position.set(-11, 0, -52);
        smallIsland.receiveShadow = true;
        smallIsland.name = "SmallIsland";
        scene.add(smallIsland);
        console.log("Added SmallIsland to scene");
        console.log("Finished setting up Level...");
    }
    window.onload = init;
    return {
        scene: scene
    };
})();

//# sourceMappingURL=game.js.map
