if (!Detector.webgl) Detector.addGetWebGLMessage();

var engine = function () {
    var engine = this;

    engine.init = function () {
        engine.json = json;
        engine.meshes = [];
        engine.models = [];


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

        engine.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 7000);

        engine.controls = new THREE.systemControls(engine.camera);
        engine.controls.movementSpeed = 150;
        engine.controls.domElement = engine.container;
        engine.controls.rollSpeed = Math.PI / 240;
        engine.controls.autoForward = false;
        engine.controls.dragToLook = false;

        engine.gridSize = 5000;
        engine.gridSegments = 50;

        engine.grid = new THREE.GridHelper(engine.gridSegments, engine.gridSegments);
        engine.grid.opacity = 0.1;
        engine.grid.transparent = true;
        engine.grid.geometry.scale(engine.gridSize / engine.gridSegments, 0, engine.gridSize / engine.gridSegments);

        engine.grid.name = "Grid";
        engine.scene.add(engine.grid);

        var geometry = new THREE.PlaneGeometry(engine.gridSize, engine.gridSize, engine.gridSegments, engine.gridSegments);
        var material = [
            new THREE.MeshLambertMaterial({color: 0xDDDDDD, side: THREE.DoubleSide, opacity: 0.1, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0xAAAA00, side: THREE.DoubleSide, opacity: 0.1, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x000099, side: THREE.DoubleSide, opacity: 0.1, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x111111, side: THREE.DoubleSide, opacity: 0.1, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x990000, side: THREE.DoubleSide, opacity: 0.1, transparent: true}),
            new THREE.MeshLambertMaterial({color: 0x009900, side: THREE.DoubleSide, opacity: 0.1, transparent: true})];

        engine.floor = new THREE.Mesh(geometry, material);
        engine.floor.rotateX(3.1415 / 2);
        engine.floor.name = "Floor";
        engine.floor.receiveShadow = true;
        engine.scene.add(engine.floor);

        var p1 = engine.gridSegments / 4 - 1;
        var p2 = engine.gridSegments * 0.75 - 1;

        // engine.paintGrid(p1, p1, 2);
        // engine.paintGrid(p1, p2, 5);
        // engine.paintGrid(p2, p1, 4);
        // engine.paintGrid(p2, p2, 1);


        for (var i = 0, len = engine.json.length; i < len; i++) {
            engine.addObj(i);
        }

        engine.renderer = new THREE.WebGLRenderer({antialias: true});
        engine.renderer.setPixelRatio(window.devicePixelRatio);
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setClearColor(0x000000);
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
        engine.controls.update(delta);
        engine.stats.update();
        engine.renderer.render(engine.scene, engine.camera);
    };

    engine.addObj = function (idx) {
        var data = engine.json[idx];
        console.log("Add:", data);

        switch (data.type) {
            case "planet": {
                var geometry = new THREE.SphereGeometry(data.radius, 32, 32);
                var material = new THREE.MeshBasicMaterial({color: data.color});
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                obj.position.set(data.orbitalDistance, 0, data.orbitalDistance);
                engine.scene.add(obj);
                break;
            }
            case "star": {
                var geometry = new THREE.SphereGeometry(data.radius, 32, 32);
                var material = new THREE.MeshBasicMaterial({color: data.color});
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                obj.position.set(0, 0, 0);
                engine.scene.add(obj);
                break;
            }
        }

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