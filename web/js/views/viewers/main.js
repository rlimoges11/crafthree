if (!Detector.webgl) Detector.addGetWebGLMessage();

var engine = function () {
    var engine = this;

    engine.init = function () {
        // Initialize engine globals
        engine.json = json;
        engine.planets = [];
        engine.planetOrbitalDistances = [];
        engine.planetColorsR = [];
        engine.planetColorsG = [];
        engine.planetColorsB = [];
        engine.planetPositionsX = [];
        engine.planetPositionsY = [];
        engine.clock = new THREE.Clock();
        engine.timer = engine.clock.elapsedTime / 10;
        engine.scene = new THREE.Scene();

        // Settings
        engine.gridVisible = false;
        engine.gridSize = 10000;
        engine.gridSegments = 200;

        // Append container to Dom
        engine.container = document.createElement('div');
        document.body.appendChild(engine.container);

        // Ambient light
        engine.scene.add(new THREE.AmbientLight(0x666666));
        engine.scene.children[0].name = "Ambient light";

        // Camera
        engine.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        engine.camera.position.set(1000, 1000, 1000);

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
        // engine.grid = new THREE.GridHelper(engine.gridSegments, engine.gridSegments, 0x333333, 0x222200);
        // engine.grid.geometry.scale(engine.gridSize / engine.gridSegments, 0, engine.gridSize / engine.gridSegments);
        // engine.grid.name = "Grid";
        // engine.grid.visible = engine.gridVisible;
        // engine.scene.add(engine.grid);

        // Shader constants
        engine.uniforms = {
            planetOrbitalDistances: {type: "f", value: engine.planetOrbitalDistances},
            planetColorsR: {value: engine.planetColorsR},
            planetColorsG: {value: engine.planetColorsG},
            planetColorsB: {value: engine.planetColorsB},
            planetPositionsX: {value: engine.planetPositionsX},
            planetPositionsY: {value: engine.planetPositionsY},
            starColor: {value: engine.star.material.color},
            timer: {type: "f", value: engine.clock.elapsedTime / 10}
        };

        // ShaderMesh
        var geometry = new THREE.PlaneGeometry(engine.gridSize, engine.gridSize, 200, 200);
        var material = new THREE.ShaderMaterial({
            uniforms: engine.uniforms,
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent,
            opacity: 0.25,
            transparent: true,
            side: THREE.DoubleSide
        });
        engine.shaderMesh = new THREE.Mesh(geometry, material);
        engine.shaderMesh.rotateX(0 - Math.PI / 2);
        engine.shaderMesh.name = "shaderMesh";
        // engine.shaderMesh.position.set(0, -100, 0);
        engine.scene.add(engine.shaderMesh);

        // Append Renderer
        engine.renderer = new THREE.WebGLRenderer({antialias: true});
        engine.renderer.setPixelRatio(window.devicePixelRatio);
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setClearColor(0x000011);
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
        engine.timer = engine.clock.elapsedTime / 10;
        engine.shaderMesh.material.uniforms.timer.value = engine.timer;

        // Orbits
        for (var i = 0; i < engine.planets.length; i++) {
            var x = Math.sin((i + engine.planets[i].orbitalVelocity / 100) * -engine.timer) * engine.planets[i].orbitalDistance;
            var z = Math.cos((i + engine.planets[i].orbitalVelocity / 100) * -engine.timer) * engine.planets[i].orbitalDistance;
            engine.planets[i].position.set(x, 0, z);
            engine.planetPositionsX[i] = x;
            engine.planetPositionsY[i] = 0-z;
            engine.shaderMesh.material.uniforms.planetPositionsX.value = engine.planetPositionsX;
            engine.shaderMesh.material.uniforms.planetPositionsY.value = engine.planetPositionsY;
        }

        engine.shaderMesh.material.uniforms.needsUpdate = true;

        engine.controls.update(engine.clock.getDelta());
        engine.stats.update();
        engine.renderer.render(engine.scene, engine.camera);
    };

    engine.addObj = function (idx) {
        var data = engine.json[idx];
        engine.planetPositionsX = [];
        engine.planetPositionsY = [];

        switch (data.type) {
            case "planet": {
                var geometry = new THREE.SphereGeometry(data.radius, 32, 32);
                var material = new THREE.MeshBasicMaterial({color: data.color});
                var obj = new THREE.Mesh(geometry, material);

                obj.name = data.name;
                obj.orbitalDistance = data.orbitalDistance;
                obj.orbitalVelocity = data.orbitalVelocity;
                var d = Math.sin(obj.orbitalDistance);
                obj.position.set(data.orbitalDistance, 0, data.orbitalDistance);
                engine.planets.push(obj);
                engine.planetOrbitalDistances.push(obj.orbitalDistance);
                engine.planetColorsR.push(material.color.r.toFixed(2));
                engine.planetColorsG.push(material.color.g.toFixed(2));
                engine.planetColorsB.push(material.color.b.toFixed(2));
                engine.planetPositionsX[engine.planetPositionsX.length] = obj.position.x;
                engine.planetPositionsY[engine.planetPositionsY.length]= obj.position.z;

                engine.scene.add(obj);
                break;
            }
            case "star": {
                var geometry = new THREE.SphereGeometry(data.radius, 32, 32);
                var material = new THREE.MeshBasicMaterial({color: data.color, opacity: 0.9, transparent: true});
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                engine.star = obj;
                // engine.star.position.setY(-380);
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