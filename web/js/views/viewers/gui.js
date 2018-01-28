engine.appendGui = function () {
    // Create gui
    engine.gui = new dat.GUI({width: 350});

    // Engine Options Folder
    engine.optionsFolder = engine.gui.addFolder("Options");
    engine.optionsFolder.add(engine.options, 'showGrid');
    engine.optionsFolder.add(engine.options, 'showOrbits');
};


engine.targetObj = function (obj) {
    if (obj == engine.scanTarget) {
        return null;
    } else {
        // Remove object-specific gui folders


        if (obj) {
            engine.untarget();
            engine.scanTarget = obj;

            // Update Options
            if (obj.objType) {
                if (engine.gui) {
                    engine.removeFolders();
                    if (obj.objType == "star") {
                        if (!engine.starFolder) {

                            engine.starFolder = engine.gui.addFolder("Star");
                            engine.starFolder.add(obj.options, "radius", 0, 25);
                            engine.starFolder.add(engine.emitters["star"].options, "sizeRandomness", 0, 25);
                            engine.starFolder.add(engine.emitters["star"].options, "colorRandomness", 0, 1);
                            engine.starFolder.add(engine.emitters["star"].options, "lifetime", .1, 100);
                            engine.starFolder.add(engine.emitters["star"].options, "turbulence", 0, 1);
                            engine.starFolder.add(engine.emitters["star"].spawner, "spawnRate", 50, 600);
                            engine.starFolder.add(engine.emitters["star"].spawner, "timeScale", -5, 5);
                            engine.starFolder.open();
                        }
                    }

                    if (obj.objType == "planet") {
                        if (!engine.planetFolder) {
                            engine.planetFolder = engine.gui.addFolder("Planet");
                            engine.planetFolder.add(obj.options, "radius", 10, 100); // onchange required
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
    if (engine.scanTarget) {
        var objType = engine.scanTarget.objType;
    }
    if (engine.planetFolder) {
        engine.gui.removeFolder(engine.planetFolder);
        engine.planetFolder = null;
    }
    if (engine.starFolder) {
        engine.gui.removeFolder(engine.starFolder);
        engine.starFolder = null;
    }
};

// Append stats
engine.stats = new Stats();
engine.container.appendChild(engine.stats.dom);

// Append Dat gui
engine.appendGui();

// Default target
engine.targetObj(engine.scene.getObjectByName("star-9"));
