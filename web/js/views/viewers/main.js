if (!Detector.webgl) Detector.addGetWebGLMessage();

var engine = function () {
    var engine = this;

    engine.init = function () {
        // Initialize engine
        engine.json = json;
        engine.meshes = [];
        engine.models = [];
        engine.planets = [];
        engine.clock = new THREE.Clock();
        engine.scene = new THREE.Scene();

        // Append container to Dom
        engine.container = document.createElement('div');
        document.body.appendChild(engine.container);

        // Ambient light
        engine.scene.add(new THREE.AmbientLight(0x666666));
        engine.scene.children[0].name = "Ambient light";

        // Camera
        engine.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 7000);

        // Setup controls
        engine.controls = new THREE.systemControls(engine.camera);
        engine.controls.movementSpeed = 150;
        engine.controls.domElement = engine.container;
        engine.controls.rollSpeed = Math.PI / 240;
        engine.controls.autoForward = false;
        engine.controls.dragToLook = false;

        // Load json objects
        for (var i = 0, len = engine.json.length; i < len; i++) {
            engine.addObj(i);
        }

        // Grid
        engine.gridSize = 3000;
        engine.gridSegments = 100;
        engine.grid = new THREE.GridHelper(engine.gridSegments, engine.gridSegments, 0x333333, 0x222200);
        engine.grid.geometry.scale(engine.gridSize / engine.gridSegments, 0, engine.gridSize / engine.gridSegments);
        engine.grid.name = "Grid";
        engine.scene.add(engine.grid);

        // Shaders
        engine.uniforms = {
            time: {value: 1.0},
            d: {value: 100.0}
        };
        var geometry = new THREE.PlaneGeometry(3000, 3000, 1);
        var material = new THREE.ShaderMaterial({
            uniforms: engine.uniforms,
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });

        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(0 - Math.PI / 2);
        // mesh.position.set(0, -75, 0);
        mesh.name = "gridPlane";
        material.opacity = 0.5;
        material.transparent = true;
        material.side = THREE.DoubleSide;
        engine.scene.add(mesh);

        // Append Renderer
        engine.renderer = new THREE.WebGLRenderer({antialias: true});
        engine.renderer.setPixelRatio(window.devicePixelRatio);
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setClearColor(0x000000);
        engine.renderer.shadowMap.Enabled = true;
        engine.renderer.shadowMap.Type = THREE.PCFSoftShadowMap;
        engine.container.appendChild(engine.renderer.domElement);

        // Append stats
        engine.stats = new Stats();
        engine.container.appendChild(engine.stats.dom);
    };

    ////////////////////
    // Animation loop;
    engine.animate = function () {
        requestAnimationFrame(engine.animate);
        var timer = Date.now() * -0.00015;
        var delta = engine.clock.getDelta();
        engine.uniforms.time = timer;

        // Orbits
        for (var i = 0; i < engine.planets.length; i++) {
            var x = Math.sin((i + engine.planets[i].orbitalVelocity / 100) * timer) * engine.planets[i].orbitalDistance;
            var z = Math.cos((i + engine.planets[i].orbitalVelocity / 100) * timer) * engine.planets[i].orbitalDistance;
            engine.planets[i].position.set(x, 0, z);
        }

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
                obj.orbitalDistance = data.orbitalDistance;
                obj.orbitalVelocity = data.orbitalVelocity;
                obj.position.set(data.orbitalDistance, 0, data.orbitalDistance);
                engine.planets.push(obj);
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