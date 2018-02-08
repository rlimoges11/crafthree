if (!Detector.webgl) Detector.addGetWebGLMessage();

var engine = function () {
    var engine = this;

    engine.init = function () {
        // Initialize engine globals
        engine.json = json;
        engine.planetOrbitalDistances = [];
        engine.planetColorsR = [];
        engine.planetColorsG = [];
        engine.planetColorsB = [];
        engine.planetRadii = [];
        engine.planetPositionsX = [];
        engine.planetPositionsY = [];
        engine.emitters = [];
        engine.clock = new THREE.Clock();
        engine.raycaster = new THREE.Raycaster();
        engine.intersects = [];
        engine.mouse = new THREE.Vector2();
        engine.tick = 0;
        engine.timer = engine.clock.elapsedTime / 50;
        engine.scene = new THREE.Scene();
        engine.scanTarget = null;

        // Engine ooptions
        engine.options = {};
        engine.options.timeFactor = 25;
        engine.options.showOrbits = true;
        engine.options.showGrid = true;
        engine.options.showWarp = true;

        // Settings
        engine.gridVisible = false;
        engine.gridSize = 10000;
        engine.gridSegments = 200;

        // Append container to Dom
        engine.container = document.createElement('div');
        document.body.appendChild(engine.container);

        // Ambient light
        // engine.scene.add(new THREE.AmbientLight(0x111111));
        // engine.scene.children[0].name = "Ambient light";

        // Main Camera
        engine.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 12500);
        engine.camera.position.set(0, 1000, 5000);

        // Scan Camera
        engine.scanCamera = new THREE.PerspectiveCamera(45, 400 / 350, 1, 12500);
        engine.scanCamera.position.set(0, 150, 150);

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
            showGrid: {value: true},
            showOrbits: {value: true},
            showWarp: {value: true},
            targetIndex: {type: "i", value: 0},
            planetOrbitalDistances: {type: "f", value: engine.planetOrbitalDistances},
            planetRadii: {type: "f", value: engine.planetRadii},
            planetColorsR: {value: engine.planetColorsR},
            planetColorsG: {value: engine.planetColorsG},
            planetColorsB: {value: engine.planetColorsB},
            planetPositionsX: {value: engine.planetPositionsX},
            planetPositionsY: {value: engine.planetPositionsY},
            starColor: {value: engine.star.material.color},
            starRadius: {value: engine.star.options.radius},
            timer: {type: "f", value: engine.clock.elapsedTime / 50}
        };

        // ShaderMesh
        var geometry = new THREE.PlaneGeometry(engine.gridSize, engine.gridSize, 100, 100);
        var material = new THREE.ShaderMaterial({
            uniforms: engine.uniforms,
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent,
            transparent: true,
            side: THREE.DoubleSide
        });
        engine.shaderMesh = new THREE.Mesh(geometry, material);
        engine.shaderMesh.rotateX(0 - Math.PI / 2);
        engine.shaderMesh.name = "shaderMesh";
        engine.scene.add(engine.shaderMesh);


        // Particle System
        engine.particleSystem = new THREE.GPUParticleSystem({
            maxParticles: 250000
        });
        engine.scene.add(engine.particleSystem);


        // Append Renderer
        engine.renderer = new THREE.WebGLRenderer({antialias: true});
        engine.renderer.setPixelRatio(window.devicePixelRatio);
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setClearColor(0x000011);
        engine.renderer.autoClear = false;
        engine.renderer.shadowMap.Enabled = true;
        engine.renderer.shadowMap.Type = THREE.PCFSoftShadowMap;
        engine.container.appendChild(engine.renderer.domElement);
    };

    ////////////////////
    // Animation loop;
    engine.animate = function () {
        requestAnimationFrame(engine.animate);
        engine.timer = engine.clock.elapsedTime / 50;
        engine.shaderMesh.material.uniforms.timer.value = engine.timer;

        // Orbits
        if (engine.scene.children.length > 0) {
            var ii = 0;
            for (var i = 0; i < engine.scene.children.length; i++) {
                var obj = engine.scene.children[i];
                if (obj.objType == "planet") {
                    var x = Math.sin(ii + (ii + obj.options.orbitalVelocity * 100) * engine.timer * (engine.options.timeFactor)/-100000) * obj.orbitalDistance;
                    var z = Math.cos(ii + (ii + obj.options.orbitalVelocity * 100) * engine.timer * (engine.options.timeFactor)/-100000) * obj.orbitalDistance;
                    if (!obj.shaderIndex) {
                        obj.shaderIndex = ii;
                    }
                    if (engine.shaderMesh.material.uniforms.showWarp.value) {
                        obj.position.set(x, -500 + obj.orbitalDistance / 5, z);
                    } else {
                        obj.position.set(x, 0, z);
                    }
                    engine.planetPositionsX[ii] = x;
                    engine.planetPositionsY[ii] = 0 - z;
                    obj.rotateY(-0.01);
                    engine.shaderMesh.material.uniforms.planetPositionsX.value = engine.planetPositionsX;
                    engine.shaderMesh.material.uniforms.planetPositionsY.value = engine.planetPositionsY;
                    ii++;
                }
            }
        }


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

        // Targeting
        engine.raycaster.setFromCamera(engine.mouse, engine.camera);
        var intersects = engine.raycaster.intersectObjects(engine.scene.children);
        engine.intersects = [];
        for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.targetable) {
                engine.intersects.push(intersects[i]);
            }
        }

        // Stats
        if (engine.stats) {
            engine.stats.update();
        }

        // Main Cam
        engine.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        engine.renderer.render(engine.scene, engine.camera);

        // Scan Cam
        if (engine.scanTarget) {
            engine.scanCamera.lookAt(engine.scanTarget.position);
            engine.scanCamera.position.setX(engine.scanTarget.position.x);
            engine.scanCamera.position.setY(engine.scanTarget.position.y + engine.scanTarget.options.radius * 2);
            engine.scanCamera.position.setZ(engine.scanTarget.position.z - engine.scanTarget.options.radius * 3 - 80);

            engine.renderer.setViewport(window.innerWidth - 365, 15, 350, 250);
            engine.renderer.render(engine.scene, engine.scanCamera);
        }
    };

    engine.addObj = function (idx) {
        var data = engine.json[idx];
        engine.planetPositionsX = [];
        engine.planetPositionsY = [];

        switch (data.type) {
            case "planet": {
                // Planet Object
                var geometry = new THREE.SphereGeometry(1, 256, 256);
                if (data.texture) {
                    data.texture = "/" + data.texture;
                    var texture = new THREE.TextureLoader().load(data.texture);
                    // texture.wrapS = THREE.RepeatWrapping;
                    // texture.wrapT = THREE.RepeatWrapping;
                    // texture.repeat.set(1, 1);
                    var material = new THREE.MeshPhongMaterial({
                        color: data.color,
                        map: texture,
                        opacity: 0.95,
                        shininess: 30,
                        transparent: true,
                        displacementMap: texture,
                        specularMap: texture,
                        lightMap: texture,
                        lightMapIntensity: 0.2,
                        displacementScale: 0.1
                    });
                } else {
                    var material = new THREE.MeshPhongMaterial({color: data.color});
                }
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                obj.scale.set(data.radius, data.radius, data.radius);
                obj.targetable = true;
                obj.orbitalDistance = data.orbitalDistance;
                obj.options = {"radius": data.radius, "color": {r: 255, g: 255, b: 255}};
                obj.options.orbitalVelocity = data.orbitalVelocity;
                obj.options.spin = 1;
                obj.position.set(data.orbitalDistance, 0, data.orbitalDistance);
                obj.objType = "planet";

                engine.planetOrbitalDistances.push(obj.orbitalDistance);
                engine.planetRadii.push(obj.options.radius);
                engine.planetColorsR.push(material.color.r.toFixed(2));
                engine.planetColorsG.push(material.color.g.toFixed(2));
                engine.planetColorsB.push(material.color.b.toFixed(2));
                engine.planetPositionsX[engine.planetPositionsX.length] = obj.position.x;
                engine.planetPositionsY[engine.planetPositionsY.length] = obj.position.z;
                obj.targetIndex = engine.planetRadii.length;

                engine.scene.add(obj);
                break;
            }
            case "star": {
                // Star Object
                var geometry = new THREE.SphereGeometry(1, 32, 32);
                var material = new THREE.MeshBasicMaterial({color: data.color, opacity: 0.5, transparent: true,});
                var obj = new THREE.Mesh(geometry, material);
                obj.name = data.name;
                obj.scale.set(data.radius, data.radius, data.radius);
                obj.targetable = true;
                obj.objType = "star";
                obj.options = {"radius": data.radius, "color": {r: 255, g: 255, b: 255}, "particleColor": {r: 255, g: 255, b: 255}};
                engine.star = obj;
                engine.star.position.setY(-350);
                obj.targetIndex = 0;
                engine.scene.add(obj);

                // Star Particle System
                engine.emitters["star"] = {};
                engine.emitters["star"].options = {
                    position: new THREE.Vector3(0, engine.star.position.y, 0),
                    positionRandomness: 10,
                    velocity: new THREE.Vector3(),
                    velocityRandomness: 3,
                    particleColor: data.color,
                    color: data.color,
                    colorRandomness: 0.1,
                    turbulence: 0.1,
                    lifetime: 40,
                    size: 5,
                    sizeRandomness: 25
                };

                // Star Particle Spawner
                engine.emitters["star"].spawner = {
                    spawnRate: 300,
                    horizontalSpeed: 1,
                    verticalSpeed: 1,
                    timeScale: 4
                };

                // Star light
                var starlight = new THREE.PointLight(engine.star.material.color);
                starlight.name = "starlight";
                engine.scene.add(starlight);
                break;
            }
        }
    };

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);

    this.init();
    this.animate();
};

function onWindowResize() {
    if (engine) {
        engine.camera.aspect = window.innerWidth / window.innerHeight;
        engine.camera.updateProjectionMatrix();
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function onMouseDown(event) {
    if (engine) {
        if (event.button == 0) {
            if (engine.intersects.length > 0) {
                engine.targetObj(engine.intersects[0].object);
            } else {
                engine.targetObj();
            }
        }
    }
}

function onMouseMove(event) {
    if (engine) {
        engine.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        engine.mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    }
}

var engine = new engine();
