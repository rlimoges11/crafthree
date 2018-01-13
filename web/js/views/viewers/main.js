if (!Detector.webgl) Detector.addGetWebGLMessage();

var engine = function () {
    var engine = this;

    engine.init = function () {
        engine.json = document.getElementById("json").innerHTML;
        engine.meshes = [];
        engine.models = [];

        console.log(json);
        engine.container = document.createElement('div');
        document.body.appendChild(engine.container);

        engine.clock = new THREE.Clock();

        engine.scene = new THREE.Scene();
        engine.scene.add(new THREE.AmbientLight(0x666666));
        engine.scene.children[0].name = "Ambient light";

        engine.pLight = new THREE.DirectionalLight(0x999999, 1, 300);
        engine.pLight.castShadow = true;
        engine.pLight.shadowDarkness = 0.5;
        engine.pLight.shadow.mapSize.width = 512;  // default
        engine.pLight.shadow.mapSize.height = 512; // default
        engine.pLight.shadow.camera.near = 0.5;       // default
        engine.pLight.shadow.camera.far = 1500;      // default

        engine.pLight.distance = 1000;
        engine.pLight.position.set(0, 40, 0);
        engine.pLight.name = "Camera light";
        engine.scene.add(engine.pLight);

        engine.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        engine.camera.position.z = 12;
        engine.camera.position.y = 8;

        // engine.controls = new THREE.JetpackControls(engine.camera);
        // engine.controls.movementSpeed = 150;
        // engine.controls.domElement = engine.container;
        // engine.controls.rollSpeed = Math.PI / 240;
        // engine.controls.autoForward = false;
        // engine.controls.dragToLook = false;

        engine.gridSize = 160;
        engine.gridSegments = 40;

        engine.grid = new THREE.GridHelper(engine.gridSegments, engine.gridSegments);
        engine.grid.opacity = 0.3;
        engine.grid.transparent = true;
        engine.grid.geometry.scale(engine.gridSize / engine.gridSegments, 0, engine.gridSize / engine.gridSegments);

        engine.grid.name = "Grid";
        engine.scene.add(engine.grid);


        var geometry = new THREE.PlaneGeometry(engine.gridSize, engine.gridSize, engine.gridSegments, engine.gridSegments);
        var material = [
            new THREE.MeshLambertMaterial({color: 0xDDDDDD, side: THREE.DoubleSide, opacity: 0.3, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0xAAAA00, side: THREE.DoubleSide, opacity: 0.3, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x000099, side: THREE.DoubleSide, opacity: 0.3, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x111111, side: THREE.DoubleSide, opacity: 0.3, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x990000, side: THREE.DoubleSide, opacity: 0.3, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x009900, side: THREE.DoubleSide, opacity: 0.3, transparent: true})];

        engine.floor = new THREE.Mesh(geometry, material);
        engine.floor.rotateX(3.1415 / 2);
        engine.floor.name = "Floor";
        engine.floor.receiveShadow = true;
        engine.scene.add(engine.floor);

        var p1 = engine.gridSegments / 4 - 1;
        var p2 = engine.gridSegments * 0.75 - 1;

        engine.paintGrid(p1, p1, 2);
        engine.paintGrid(p1, p2, 5);
        engine.paintGrid(p2, p1, 4);
        engine.paintGrid(p2, p2, 1);

        engine.renderer = new THREE.WebGLRenderer({antialias: true});
        engine.renderer.setPixelRatio(window.devicePixelRatio);
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setClearColor(0xCCCCCC);
        engine.renderer.shadowMap.Enabled = true;
        engine.renderer.shadowMap.Type = THREE.PCFSoftShadowMap;

        engine.stats = new Stats();
        engine.container.appendChild(engine.renderer.domElement);
        engine.container.appendChild(engine.stats.dom);
    };

    engine.paintGrid = function (x, y, c) {
        var face = (x * 2) + (y * (engine.gridSegments * 2) );
        engine.floor.geometry.faces[face].materialIndex = c;
        engine.floor.geometry.faces[face + 1].materialIndex = c;
    };

    ////////////////////
    // Animation loop;
    engine.animate = function () {
        requestAnimationFrame(engine.animate);
        var timer = Date.now() * 0.0001;
        var delta = engine.clock.getDelta();
        engine.pLight.position.z = engine.camera.position.z;
        engine.pLight.position.x = engine.camera.position.x;
        engine.pLight.lookAt(engine.scene.position);
        // engine.controls.update(delta);
        engine.stats.update();
        engine.renderer.render(engine.scene, engine.camera);
    };


    window.addEventListener('resize', onWindowResize, false);

    this.init();
    this.animate();
};

var engine = new engine();
window.addEventListener('resize', onWindowResize(), false);

function onWindowResize() {
    if (engine) {
        engine.camera.aspect = window.innerWidth / window.innerHeight;
        engine.camera.updateProjectionMatrix();
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}