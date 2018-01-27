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

        // Camera
        engine.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 12500);
        engine.camera.position.set(0, 1000, 5000);

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
        // options passed during each spawned
        engine.particleSystem.options = {
            position: new THREE.Vector3(),
            positionRandomness: .3,
            velocity: new THREE.Vector3(),
            velocityRandomness: .5,
            color: 0xaa88ff,
            colorRandomness: .2,
            turbulence: .5,
            lifetime: 2,
            size: 5,
            sizeRandomness: 1
        };
        engine.particleSystem.spawnerOptions = {
            spawnRate: 15000,
            horizontalSpeed: 1.5,
            verticalSpeed: 1.33,
            timeScale: 1
        };

        // Append GUI
        engine.gui = new dat.GUI({width: 350});
        engine.gui.add(engine.particleSystem.options, "velocityRandomness", 0, 3);
        engine.gui.add(engine.particleSystem.options, "positionRandomness", 0, 3);
        engine.gui.add(engine.particleSystem.options, "size", 1, 20);
        engine.gui.add(engine.particleSystem.options, "sizeRandomness", 0, 25);
        engine.gui.add(engine.particleSystem.options, "colorRandomness", 0, 1);
        engine.gui.add(engine.particleSystem.options, "lifetime", .1, 10);
        engine.gui.add(engine.particleSystem.options, "turbulence", 0, 1);
        engine.gui.add(engine.particleSystem.spawnerOptions, "spawnRate", 10, 30000);
        engine.gui.add(engine.particleSystem.spawnerOptions, "timeScale", -1, 1);


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

        // Particles
        var delta = engine.clock.getDelta() * engine.particleSystem.spawnerOptions.timeScale;
        engine.tick += delta;
        if (engine.tick < 0) engine.tick = 0;
        if (delta > 0) {
            engine.particleSystem.options.position.x = Math.sin(engine.tick * engine.particleSystem.spawnerOptions.horizontalSpeed) * 20;
            engine.particleSystem.options.position.y = Math.sin(engine.tick * engine.particleSystem.spawnerOptions.verticalSpeed) * 10;
            engine.particleSystem.options.position.z = Math.sin(engine.tick * engine.particleSystem.spawnerOptions.horizontalSpeed + engine.particleSystem.spawnerOptions.verticalSpeed) * 5;
            for (var x = 0; x < engine.particleSystem.spawnerOptions.spawnRate * delta; x++) {
                // Yep, that's really it.	Spawning particles is super cheap, and once you spawn them, the rest of
                // their lifecycle is handled entirely on the GPU, driven by a time uniform updated below
                engine.particleSystem.spawnParticle(engine.particleSystem.options);
            }
        }
        engine.particleSystem.update(engine.tick);

        // Controls
        engine.controls.update(engine.clock.getDelta());

        // Stats
        engine.stats.update();

        // Render
        engine.renderer.render(engine.scene, engine.camera);
    };

    engine.addObj = function (idx) {
        var data = engine.json[idx];
        engine.planetPositionsX = [];
        engine.planetPositionsY = [];

        switch (data.type) {
            case "planet": {
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
                var geometry = new THREE.SphereGeometry(data.radius, 32, 32);
                var material = new THREE.MeshBasicMaterial({color: data.color, opacity: 0.75, transparent: true});
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                engine.star = obj;
                engine.star.position.setY(-350);
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