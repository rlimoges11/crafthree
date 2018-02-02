engine.appendGui = function () {
    // Create gui
    engine.gui = new dat.GUI({width: 350});

    // Engine Options Folder
    engine.optionsFolder = engine.gui.addFolder("Options");
    var showWarp = engine.optionsFolder.add(engine.options, 'showWarp');
    showWarp.onChange(function () {
        engine.shaderMesh.material.uniforms.showWarp.value = engine.options.showWarp;
        if (engine.options.showWarp) {
            engine.star.position.setY(-350);
            engine.emitters["star"].options.position.y = -350;
        } else {
            engine.star.position.setY(-0);
            engine.emitters["star"].options.position.y = 0;
        }
    });
    var showGrid = engine.optionsFolder.add(engine.options, 'showGrid');
    showGrid.onChange(function () {
        engine.shaderMesh.material.uniforms.showGrid.value = engine.options.showGrid;
    });
    var showOrbits = engine.optionsFolder.add(engine.options, 'showOrbits');
    showOrbits.onChange(function () {
        engine.shaderMesh.material.uniforms.showOrbits.value = engine.options.showOrbits;
    });
};

engine.targetObj = function (obj) {
    if (obj == engine.scanTarget) {
        return null;
    } else {
        if (obj) {
            engine.untarget();
            engine.scanTarget = obj;
            engine.shaderMesh.material.uniforms.targetIndex.value = obj.targetIndex;

            // Update Options
            if (obj.objType) {
                if (engine.gui) {
                    engine.removeFolders();
                    if (obj.objType == "star") {
                        if (!engine.starFolder) {
                            engine.starFolder = engine.gui.addFolder("Star");
                            var starColor = engine.starFolder.addColor(obj.options, "color");
                            starColor.onChange(function (val) {
                                obj.material.color.r = val.r / 256;
                                obj.material.color.g = val.g / 256;
                                obj.material.color.b = val.b / 256;
                                obj.material.starColor = obj.material.color;
                            });
                            var radius = engine.starFolder.add(obj.options, "radius", 10, 100);
                            radius.onChange(function () {
                                obj.scale.set(obj.options.radius, obj.options.radius, obj.options.radius);
                                engine.shaderMesh.material.uniforms.starRadius.value = obj.options.radius;
                            });
                            engine.starFolder.open();
                        }
                        if (!engine.starParticleFolder) {
                            engine.starParticleFolder = engine.gui.addFolder("Star Particles");
                            engine.starParticleFolder.addColor(engine.emitters["star"].options, "color");
                            engine.starParticleFolder.add(engine.emitters["star"].options, "sizeRandomness", 0, 25);
                            engine.starParticleFolder.add(engine.emitters["star"].options, "colorRandomness", 0, 1);
                            engine.starParticleFolder.add(engine.emitters["star"].options, "lifetime", .1, 100);
                            engine.starParticleFolder.add(engine.emitters["star"].options, "turbulence", 0, 1);
                            engine.starParticleFolder.add(engine.emitters["star"].spawner, "spawnRate", 50, 600);
                            engine.starParticleFolder.add(engine.emitters["star"].spawner, "timeScale", -5, 5);
                            engine.starParticleFolder.open();
                        }
                    }

                    if (obj.objType == "planet") {
                        if (!engine.planetFolder) {
                            engine.planetFolder = engine.gui.addFolder("Planet");
                            var planetColor = engine.planetFolder.addColor(obj.options, "color");
                            planetColor.onChange(function (val) {
                                obj.material.color.r = val.r / 256;
                                obj.material.color.g = val.g / 256;
                                obj.material.color.b = val.b / 256;
                                engine.shaderMesh.material.uniforms.planetColorsR.value[obj.shaderIndex] = obj.material.color.r;
                                engine.shaderMesh.material.uniforms.planetColorsG.value[obj.shaderIndex] = obj.material.color.g;
                                engine.shaderMesh.material.uniforms.planetColorsB.value[obj.shaderIndex] = obj.material.color.b;
                            });
                            var radius = engine.planetFolder.add(obj.options, "radius", 10, 200); // onchange required
                            radius.onChange(function () {
                                obj.scale.set(obj.options.radius, obj.options.radius, obj.options.radius);
                                engine.shaderMesh.material.uniforms.planetRadii.value[obj.shaderIndex] = obj.options.radius;
                            });
                            var orbitalDistance = engine.planetFolder.add(obj, "orbitalDistance", 100, 5000); // onchange required
                            orbitalDistance.onChange(function () {
                                engine.shaderMesh.material.uniforms.planetOrbitalDistances.value[obj.shaderIndex] = obj.orbitalDistance;
                            });
                            engine.planetFolder.add(obj.options, "orbitalVelocity", 10, 100); // onchange required
                            engine.planetFolder.open();
                        }
                    }
                }
            }
        }
        else {
            // engine.removeFolders();
            // engine.untarget();
        }
    }
};

engine.untarget = function () {
    engine.scanTarget = null;
};

engine.removeFolders = function () {
    // Remove object-specific gui folders
    if (engine.planetFolder) {
        engine.gui.removeFolder(engine.planetFolder);
        engine.planetFolder = null;
    }
    if (engine.starFolder) {
        engine.gui.removeFolder(engine.starFolder);
        engine.starFolder = null;
    }
    if (engine.starParticleFolder) {
        engine.gui.removeFolder(engine.starParticleFolder);
        engine.starParticleFolder = null;
    }
};

// Append stats
engine.stats = new Stats();
engine.container.appendChild(engine.stats.dom);

// Append Dat gui
engine.appendGui();

// Default target
engine.targetObj(engine.scene.getObjectByName("star-9"));
