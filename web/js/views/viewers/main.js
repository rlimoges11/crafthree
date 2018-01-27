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
        engine.planetRadii = [];
        engine.planetPositionsX = [];
        engine.planetPositionsY = [];
        engine.emitters = [];
        engine.clock = new THREE.Clock();
        engine.tick = 0;
        engine.timer = engine.clock.elapsedTime / 50;
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

        // Main Camera
        engine.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 12500);
        engine.camera.position.set(0, 1000, 5000);


        // Scan Camera
        engine.scanCamera = new THREE.PerspectiveCamera(45, 400 / 350, 1, 12500);
        engine.scanCamera.position.set(0, -350, 150);
        engine.scene.add(engine.scanCamera);

        engine.scene.add(engine.scanCamera);


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

        // Shader constants
        engine.uniforms = {
            planetOrbitalDistances: {type: "f", value: engine.planetOrbitalDistances},
            planetRadii: {type: "f", value: engine.planetRadii},
            planetColorsR: {value: engine.planetColorsR},
            planetColorsG: {value: engine.planetColorsG},
            planetColorsB: {value: engine.planetColorsB},
            planetPositionsX: {value: engine.planetPositionsX},
            planetPositionsY: {value: engine.planetPositionsY},
            starColor: {value: engine.star.material.color},
            timer: {type: "f", value: engine.clock.elapsedTime / 50}
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


        // Particle System
        engine.particleSystem = new THREE.GPUParticleSystem({
            maxParticles: 250000
        });
        engine.scene.add(engine.particleSystem);

        // Append GUI
        // engine.gui = new dat.GUI({width: 350});
        // engine.gui.add(engine.emitters["star"].options, "velocityRandomness", 0, 3);
        // engine.gui.add(engine.emitters["star"].options, "positionRandomness", 0, 3);
        // engine.gui.add(engine.emitters["star"].options, "size", 1, 20);
        // engine.gui.add(engine.emitters["star"].options, "sizeRandomness", 0, 25);
        // engine.gui.add(engine.emitters["star"].options, "colorRandomness", 0, 1);
        // engine.gui.add(engine.emitters["star"].options, "lifetime", .1, 100);
        // engine.gui.add(engine.emitters["star"].options, "turbulence", 0, 1);
        // engine.gui.add(engine.emitters["star"].spawner, "spawnRate", 10, 10000);
        // engine.gui.add(engine.emitters["star"].spawner, "timeScale", -5, 5);


        // Append Renderer
        engine.renderer = new THREE.WebGLRenderer({antialias: true});
        engine.renderer.setPixelRatio(window.devicePixelRatio);
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setClearColor(0x000011);
        engine.renderer.autoClear = false;
        // engine.renderer.shadowMap.Enabled = true;
        // engine.renderer.shadowMap.Type = THREE.PCFSoftShadowMap;
        engine.container.appendChild(engine.renderer.domElement);

        // Append stats
        engine.stats = new Stats();
        engine.container.appendChild(engine.stats.dom);
    };

    ////////////////////
    // Animation loop;
    engine.animate = function () {
        requestAnimationFrame(engine.animate);
        engine.timer = engine.clock.elapsedTime / 50;
        engine.shaderMesh.material.uniforms.timer.value = engine.timer;

        // Orbits
        for (var i = 0; i < engine.planets.length; i++) {
            var x = Math.sin(i + (i + engine.planets[i].orbitalVelocity / 100) * -engine.timer) * engine.planets[i].orbitalDistance;
            var z = Math.cos(i + (i + engine.planets[i].orbitalVelocity / 100) * -engine.timer) * engine.planets[i].orbitalDistance;
            engine.planets[i].position.set(x, -500 + engine.planets[i].orbitalDistance / 5, z);
            engine.planetPositionsX[i] = x;
            engine.planetPositionsY[i] = 0 - z;
            engine.planets[i].rotateY(-0.01);
            engine.shaderMesh.material.uniforms.planetPositionsX.value = engine.planetPositionsX;
            engine.shaderMesh.material.uniforms.planetPositionsY.value = engine.planetPositionsY;
        }

        // Shaders
        engine.shaderMesh.material.uniforms.needsUpdate = true;

        // Particle Emitters

        // Star
        var delta = engine.clock.getDelta() * engine.emitters["star"].spawner.timeScale;
        engine.tick += delta;
        if (engine.tick < 0) engine.tick = 0;
        if (delta > 0) {
            for (var x = 0; x < engine.emitters["star"].spawner.spawnRate * delta; x++) {
                engine.particleSystem.spawnParticle(engine.emitters["star"].options);
            }
        }
        engine.particleSystem.update(engine.tick);

        // Controls
        engine.controls.update(engine.clock.getDelta());

        // Stats
        engine.stats.update();

        // Main Cam
        engine.camera.updateProjectionMatrix();
        engine.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        engine.renderer.render(engine.scene, engine.camera);

        // Scan Cam
        // engine.scanCamera.updateProjectionMatrix();
        engine.renderer.setViewport(window.innerWidth - 450, 50, 400, 350);
        engine.renderer.render(engine.scene, engine.scanCamera);
    };

    engine.addObj = function (idx) {
        var data = engine.json[idx];
        engine.planetPositionsX = [];
        engine.planetPositionsY = [];

        switch (data.type) {
            case "planet": {
                // Planet Object
                var geometry = new THREE.SphereGeometry(data.radius, 32, 32);
                if (data.texture) {
                    data.texture = "/" + data.texture;
                    var texture = new THREE.TextureLoader().load(data.texture);
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(2, 2);
                    var material = new THREE.MeshLambertMaterial({color: data.color, map: texture});
                } else {
                    var material = new THREE.MeshLambertMaterial({color: data.color, opacity: 0.9, transparent: true});
                }
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                obj.radius = data.radius;
                obj.orbitalDistance = data.orbitalDistance;
                obj.orbitalVelocity = data.orbitalVelocity;
                var d = Math.sin(obj.orbitalDistance);
                obj.position.set(data.orbitalDistance, 0, data.orbitalDistance);
                engine.planets.push(obj);
                engine.planetOrbitalDistances.push(obj.orbitalDistance);
                engine.planetRadii.push(obj.radius);
                engine.planetColorsR.push(material.color.r.toFixed(2));
                engine.planetColorsG.push(material.color.g.toFixed(2));
                engine.planetColorsB.push(material.color.b.toFixed(2));
                engine.planetPositionsX[engine.planetPositionsX.length] = obj.position.x;
                engine.planetPositionsY[engine.planetPositionsY.length] = obj.position.z;

                engine.scene.add(obj);
                break;
            }
            case "star": {
                // Star Object
                var geometry = new THREE.SphereGeometry(data.radius / 3., 32, 32);
                var material = new THREE.MeshBasicMaterial({color: data.color, opacity: 0.9, transparent: true});
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                engine.star = obj;
                engine.star.position.setY(-350);
                engine.scene.add(obj);

                // Star Particle System
                engine.emitters["star"] = {};
                engine.emitters["star"].options = {
                    position: new THREE.Vector3(0, -350, 0),
                    positionRandomness: 10,
                    velocity: new THREE.Vector3(),
                    velocityRandomness: 3,
                    color: engine.star.material.color,
                    colorRandomness: 0.6,
                    turbulence: 0.1,
                    lifetime: 25,
                    size: 5,
                    sizeRandomness: 10
                };

                // Star Particle Spawner
                engine.emitters["star"].spawner = {
                    spawnRate: 300,
                    horizontalSpeed: 1,
                    verticalSpeed: 1,
                    timeScale: 4
                };
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

        // engine.scanCamera.aspect = window.innerWidth / window.innerHeight;
        // engine.scanCamera.updateProjectionMatrix();

        engine.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}