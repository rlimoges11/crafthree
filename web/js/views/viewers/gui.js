engine.appendGui = function () {
    // Create gui
    engine.gui = new dat.GUI({width: 350});

    // Engine Options Folder
    engine.optionsFolder = engine.gui.addFolder("Options");
    engine.optionsFolder.add(engine.options, 'timeFactor', -100, 100);
    engine.optionsFolder.add(engine.options, 'showWarp').onChange(function () {
        engine.shaderMesh.material.uniforms.showWarp.value = engine.options.showWarp;
        if (engine.options.showWarp) {
            engine.star.position.setY(-350);
            engine.emitters["star"].options.position.y = -350;
        } else {
            engine.star.position.setY(-0);
            engine.emitters["star"].options.position.y = 0;
        }
    });
    engine.optionsFolder.add(engine.options, 'showGrid').onChange(function () {
        engine.shaderMesh.material.uniforms.showGrid.value = engine.options.showGrid;
    });
    engine.optionsFolder.add(engine.options, 'showOrbits').onChange(function () {
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
                            engine.starFolder.addColor(obj.options, "color").onChange(function (val) {
                                obj.material.color.r = val.r / 256;
                                obj.material.color.g = val.g / 256;
                                obj.material.color.b = val.b / 256;
                                obj.material.starColor = obj.material.color;

                                for (i = 0; i < engine.scene.children.length; i++) {
                                    if (engine.scene.children[i].objType == "planet") {
                                        engine.scene.children[i].material.specular = obj.material.starColor;
                                    }
                                }
                            });
                            engine.starFolder.add(obj.options, "radius", 10, 100).onChange(function () {
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
                            engine.planetFolder.addColor(obj.options, "color").onChange(function (val) {
                                obj.material.color.r = val.r / 256;
                                obj.material.color.g = val.g / 256;
                                obj.material.color.b = val.b / 256;
                                engine.shaderMesh.material.uniforms.planetColorsR.value[obj.shaderIndex] = obj.material.color.r;
                                engine.shaderMesh.material.uniforms.planetColorsG.value[obj.shaderIndex] = obj.material.color.g;
                                engine.shaderMesh.material.uniforms.planetColorsB.value[obj.shaderIndex] = obj.material.color.b;
                            });
                            engine.planetFolder.add(obj.material, "displacementScale", -0.25, 0.25);
                            engine.planetFolder.add(obj.options, "radius", 10, 200).onChange(function () {
                                obj.scale.set(obj.options.radius, obj.options.radius, obj.options.radius);
                                engine.shaderMesh.material.uniforms.planetRadii.value[obj.shaderIndex] = obj.options.radius;
                            });
                            engine.planetFolder.add(obj.material, "shininess", 0, 100).onChange(function () {

                            });
                            engine.planetFolder.add(obj, "orbitalDistance", 500, 5000).onChange(function () {
                                engine.shaderMesh.material.uniforms.planetOrbitalDistances.value[obj.shaderIndex] = obj.orbitalDistance;
                            });
                            engine.planetFolder.add(obj.options, "orbitalVelocity", 10, 100); // onchange required
                            engine.planetFolder.open();
                        }
                    }
                }
            }
        }
        // else {
        //     engine.removeFolders();
        //     engine.untarget();
        // }
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
engine.targetObj(engine.scene.children[0]);
