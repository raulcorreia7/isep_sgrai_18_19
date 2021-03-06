import { Component, ElementRef, OnInit } from '@angular/core';
import * as dat from 'dat.gui';
import * as Stats from 'stats.js';
import * as THREE from 'three';
import * as OrbitControls from 'three-orbitcontrols';
import { ConfigService } from './config.service';
import { CreateArmarioGUI } from './gui/CreateArmarioGUI';
import { Armario } from './model/armario';
import { Cabide } from './model/cabide';
import { Divisao } from './model/divisao';
import { FocoDeLuz } from './model/focoDeLuz';
import { Gaveta } from './model/gaveta';
import { Porta } from './model/porta';
import { Prateleira } from './model/prateleira';
import { componentRefresh } from '@angular/core/src/render3/instructions';
import { Scene } from 'three';
import { Variable } from '@angular/compiler/src/render3/r3_ast';
import { SoundManager } from './model/SoundManager';
import { TextureManager } from './model/TextureManager';
interface Rotation {
  x: number;
  y: number;
  z: number;
}

interface Rotateable {
  rotation: Rotation;
}

//declare const THREE: any;

@Component({
  selector: 'my-scene',
  template: '',
  styles: [`
    :xhost {
      display: grid;
    }

    xcanvas {
      height: 100%;
      width: 100%;
    }
  `],
})
export class SceneComponent implements OnInit {
  private host: HTMLElement = this.elRef.nativeElement;

  private renderer: THREE.WebGLRenderer;
  static camera: THREE.Camera;
  private scene: THREE.Scene;
  private controls: OrbitControls;
  private datgui;
  public objetoSelecionado;
  private controlkit;
  private Armario;
  private stats;
  //static raycaster: THREE.Raycaster;
  static mouse: THREE.Vector2;
  static sceneRaycaster: THREE.Scene;
  static INTERSECTED;
  static componentes;
  static instance;
  static hasChanged;
  static collisions = new CollisionDetection();


  /**
   * Background Sound
   * Raúl
   */
  private listener = new THREE.AudioListener();
  private sound = new THREE.Audio(this.listener);
  private whichCamera = 1;

  //datgui
  private datguiStructure: {
    folderobjeto,
    objectcounter,
    allfolders
  }
  private color: {
    texture_color,
    light_color
  }
  constructor(private elRef: ElementRef, private config: ConfigService) {
    SceneComponent.instance = this;
  }

  ngOnInit() {

    SceneComponent.hasChanged = false;
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.position = "fixed";
    this.stats.dom.style.top = null;
    this.stats.dom.style.bottom = 0;
    document.body.appendChild(this.stats.dom);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.scene = new THREE.Scene();
    SceneComponent.sceneRaycaster = this.scene;

    SceneComponent.mouse = new THREE.Vector2();
    //SceneComponent.raycaster = new THREE.Raycaster;
    SceneComponent.componentes = new Array();

    this.initCamera();
    this.initBackground();
    this.initFloor();
    this.initRenderer();
    this.initControlKit();
    this.initdatGUI();
    //this.initObjects();
    this.initLights();
    this.initMusic();
    const render = () => {
      this.stats.begin();
      this.controlkit.update();
      this.renderer.render(this.scene, SceneComponent.camera);
      this.stats.end();
      requestAnimationFrame(render);
    }


    var lastFrameTime = new Date().getTime() / 1000;
    var totalGameTime = 0;
    const update = (dt, t) => {
      //console.log(dt, t);

      SceneComponent.componentes.forEach(element => {
        if (element.update != null) {
          element.update(dt);
        }

      })
      setTimeout(function () {
        var currTime = new Date().getTime() / 1000;
        var dt = currTime - (lastFrameTime || currTime);
        totalGameTime += dt;

        update(dt, totalGameTime);

        lastFrameTime = currTime;
      }, 0);
    }
    const updateColisions = () => {
      if (SceneComponent.hasChanged) {
        SceneComponent.collisions.TestAll();
        SceneComponent.hasChanged = false;
      }
      setTimeout(function () {
        updateColisions();
      }, 1750 / 2);
    }

    render();
    update(0, totalGameTime);
    updateColisions();
  }
  initBackground(): any {

    var texture = new THREE.TextureLoader().load('assets/texture/sky_background.jpg', function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      //texture.offset(0, 0);
      texture.repeat.set(1, 1);
    });
    var galaxy = new THREE.Mesh(
      new THREE.SphereGeometry(256, 128, 128),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide
      })
    )
    this.scene.add(galaxy);

  }
  initMusic(): any {
    var audioLoader = new THREE.AudioLoader();
    var sound = this.sound;
    audioLoader.load('assets/music/elevator_music.mp3', function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.30);
      sound.play();
    }, () => { }, () => { });
  }
  initControlKit(): any {
    this.controlkit = new CreateArmarioGUI(this, this.createArmarioAddScene);
  }

  initdatGUI(): void {
    this.datgui = new dat.GUI();
    this.datguiStructure = {
      folderobjeto: "",
      objectcounter: 0,
      allfolders: []
    }
    this.color = {
      texture_color: 0,
      light_color: 0,
    }
    // var cam = this.datgui.addFolder('Camera');
    // var x = cam.add(SceneComponent.camera.position, 'x', -100, 100).listen();
    // cam.add(SceneComponent.camera.position, 'y', -100, 100).listen();
    // cam.add(SceneComponent.camera.position, 'z', -100, 100).listen();


  }
  initdatGuiObjeto(objeto, isArmario = false, isLight = false) {
    var folder;
    folder = this.datgui.addFolder(objeto.name + " " + this.datguiStructure.objectcounter++);

    this.datguiStructure.allfolders.push(folder);
    var x = folder.add(objeto.position, 'x', -30, 30).step(0.1)
      .listen()
    x.onChange((value) => {
      objeto.position.x = value;
      SceneComponent.hasChanged = true;
    });
    var y = folder.add(objeto.position, 'y', -30, 30).step(0.1).listen();
    y.onChange((value) => {
      objeto.position.y = value;
      SceneComponent.hasChanged = true;
    });
    var z = folder.add(objeto.position, 'z', -30, 30).step(0.1).listen();
    z.onChange((value) => {
      objeto.position.z = value;
      SceneComponent.hasChanged = true;
    });

    var color = Math.random() * 0xffffff;
    folder.addColor(this.color, 'texture_color', color).onChange(() => {
      objeto.children.forEach(element => {
        if (element.material != null)
          element.material.color.setHex(this.dec2hex(this.color.texture_color));
      });

    });
    if (objeto.isLight != null && objeto.isLight == true)
      var color2 = Math.random() * 0xffffff;

    if (isLight) {
      folder.addColor(this.color, 'light_color', color2).onChange(() => {
        objeto.light.color.setHex(this.dec2hex(this.color.light_color));
      });
    }
    /*
  Alterar textura
*/

    var structure_texture = {
      Texture: objeto.textureName
    };
    folder.add(structure_texture, "Texture", TextureManager.getInstance().getTextures())
      .onChange((value) => {
        objeto.loadTexture(value);
      })
    if (isArmario == false) {
      var structure = {
        remove:
          function remove() {
            var _datgui = SceneComponent.instance.datgui;
            var _objeto = objeto;
            var _folder = folder;
            var _armario = SceneComponent.instance.Armario;
            _armario.remove(_objeto);
            _datgui.removeFolder(_folder);
            SoundManager.getInstance().playSound("REMOVED");
          }
      }
      folder.add(structure, "remove");
    } else {
      var structure = {
        remove:
          function remove() {
            var _datgui = SceneComponent.instance.datgui;
            //var _folder = folder;
            var _armario = SceneComponent.instance.Armario;
            SceneComponent.instance.scene.remove(_armario);
            SceneComponent.instance.datguiStructure.allfolders.forEach(subfolder => _datgui.removeFolder(subfolder));
            SceneComponent.instance.controlkit.enableArmarioMenu();
            SceneComponent.instance.Armario = null;
            SoundManager.getInstance().playSound("REMOVED");
          }
      }
      folder.add(structure, "remove");
    }
    if (objeto instanceof Porta) {
      var structure_2 = {
        rotate: function () {
          objeto.rotateAndChangeDirection();
        }
      }
      folder.add(structure_2, "rotate");
    };

  }
  initFloor(): void {
    var texture = new THREE.TextureLoader().load('assets/texture/floor.jpg', function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      //texture.offset(0, 0);
      texture.repeat.set(10, 10);
    });
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200, 200, 200),
      new THREE.MeshPhysicalMaterial({
        map: texture,
        side: THREE.DoubleSide
      })
    );
    floor.rotation.x -= Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }
  initRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    document.addEventListener('mousedown', this.onMouseDown, false);
    window.addEventListener('keydown', this.onDocumentKeyDown, false);
    this.renderer.gammaOutput = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
  }

  initObjects(): void {
    var armario = new Armario(12, 12, 12);
    this.initdatGuiObjeto(armario);
    armario.position.y = 6;
    armario.position.z = -30;
    this.objetoSelecionado = armario;
    var alturaArmario = 20;
    var profundidadeArmario = 10;
    var armario3 = new Armario(20, alturaArmario, profundidadeArmario);

    this.initdatGuiObjeto(armario3);
    armario3.position.y = 10;
    armario3.position.x = 17;

    var divisao = new Divisao(alturaArmario, profundidadeArmario, true);
    divisao.position.x = -5;
    var divisao2 = new Divisao(alturaArmario, profundidadeArmario, false);
    divisao2.position.x = 5;
    armario3.add(divisao);
    armario3.add(divisao2);
    armario3.position.z = -30;


    var altura = 20;
    var armario2 = new Armario(12, altura, 12);
    armario2.name = "Armario";
    this.initdatGuiObjeto(armario2);
    armario2.position.y = altura / 2;
    armario2.position.x = -15;

    var gaveta = new Gaveta(10, 4, 10);
    gaveta.name = "Gaveta"
    this.initdatGuiObjeto(gaveta);
    armario2.add(gaveta);
    //gaveta.position.x = -0.5;  // Em colisão
    gaveta.position.y = -4.5;
    armario2.position.z = -30;

    var porta = new Porta(10, 10);
    porta.name = "Porta";
    this.initdatGuiObjeto(porta);
    armario.adicionarComponente(porta);
    //porta.position.z = 1;
    SceneComponent.componentes.push(porta);

    var cabide = new Cabide(10);
    cabide.name = "Cabide";
    this.initdatGuiObjeto(cabide);
    armario2.add(cabide);
    cabide.position.y = 5;

    var prateleira = new Prateleira(10, 10);
    prateleira.name = "Prateleira";
    this.initdatGuiObjeto(prateleira);
    armario2.add(prateleira);
    prateleira.position.z = 1;

    SceneComponent.componentes.push(gaveta);
    SceneComponent.componentes.push(cabide);
    SceneComponent.componentes.push(prateleira);

    var Collisions = new CollisionDetection();



    Collisions.addElement(gaveta);
    Collisions.addElement(prateleira);
    Collisions.addElement(cabide);
    Collisions.addElement(armario2);
    Collisions.testElement(gaveta); // testar colisão da gaveta com outros
    Collisions.testElement(cabide);
    Collisions.testElement(prateleira);

    this.scene.add(armario2);
    this.scene.add(armario);
    this.scene.add(armario3);

    var focoDeLuz = new FocoDeLuz(armario2.position.x, armario2.position.y - 1, armario2.position.z);
    SceneComponent.componentes.push(focoDeLuz);
    this.initdatGuiObjeto(focoDeLuz);
    this.scene.add(focoDeLuz);

    //document.addEventListener("keydown", this.On)

  }

  initLights(): void {
    var ambientLight = new THREE.AmbientLight(0x404040, 0.7);
    var directionalLight = new THREE.SpotLight(0xffffff, 0.5);
    directionalLight.castShadow = true;
    directionalLight.position.set(0, 25, 25);
    directionalLight.target.position.set(0, -1, -1);
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadowMapHeight = 1024;
    directionalLight.shadowMapWidth = 1024;
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
  }
  initCamera(): void {
    SceneComponent.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.controls = new OrbitControls(SceneComponent.camera, this.renderer.domElement);
    SceneComponent.camera.add(this.listener);
    SceneComponent.camera.position.set(0, 20, 55);
    SceneComponent.camera.lookAt(0, 0, 0);
  }
  initOrthoCamera(): void {
    SceneComponent.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2,
      window.innerHeight / 2, window.innerHeight / -2, 0, 1000);
    this.controls = new OrbitControls(SceneComponent.camera, this.renderer.domElement);
    SceneComponent.camera.add(this.listener);
    SceneComponent.camera.position.set(0, 20, 55);
    SceneComponent.camera.lookAt(0, 0, 0);
  }
  onMouseDown(event: MouseEvent): void {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    SceneComponent.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    SceneComponent.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(SceneComponent.mouse, SceneComponent.camera)
    var intersects = raycaster.intersectObjects(SceneComponent.sceneRaycaster.children, true);

    if (intersects.length > 0) {
      for (var i = 0; i < intersects.length; i++) {
        if (intersects[0].object.parent === SceneComponent.componentes[i]) {
          if (SceneComponent.INTERSECTED != intersects[0].object) {
            if (SceneComponent.INTERSECTED) SceneComponent.INTERSECTED.material.emissive.setHex(SceneComponent.INTERSECTED.currentHex);
            SceneComponent.INTERSECTED = intersects[0].object;
            SceneComponent.INTERSECTED.currentHex = SceneComponent.INTERSECTED.material.emissive.getHex();
            SceneComponent.INTERSECTED.material.emissive.setHex(0xff0000);

            if (SceneComponent.INTERSECTED.parent.children.length > 0) {
              this.objetoSelecionado = SceneComponent.INTERSECTED.parent;
            } else {
              this.objetoSelecionado = SceneComponent.INTERSECTED;
            }
          } else {
            // Double click no objeto
            this.objetoSelecionado.animate();
          }
        }
      }
    } else {
      if (SceneComponent.INTERSECTED || this.objetoSelecionado) {
        SceneComponent.INTERSECTED.material.emissive.setHex(SceneComponent.INTERSECTED.currentHex);
        //this.objetoSelecionado.material.emissive.setHex(this.objetoSelecionado.currentHex);
        SceneComponent.INTERSECTED = null;
        this.objetoSelecionado = null;
      }

    }
    //if (this.objetoSelecionado != null)
    //console.log(this.objetoSelecionado);

  }


  dec2hex(i) {
    var result = "0x000000";
    if (i >= 0 && i <= 15) { result = "0x00000" + i.toString(16); }
    else if (i >= 16 && i <= 255) { result = "0x0000" + i.toString(16); }
    else if (i >= 256 && i <= 4095) { result = "0x000" + i.toString(16); }
    else if (i >= 4096 && i <= 65535) { result = "0x00" + i.toString(16); }
    else if (i >= 65535 && i <= 1048575) { result = "0x0" + i.toString(16); }
    else if (i >= 1048575) { result = '0x' + i.toString(16); }
    if (result.length == 8) { return result; }

  }

  createArmarioAddScene(armario) {
    //console.log(armario);
    this.Armario = armario;
    this.scene.add(armario);
    this.initdatGuiObjeto(armario, true);
    //SceneComponent.collisions.addElement(armario);
    SceneComponent.collisions.armario = armario;
    SoundManager.getInstance().playSound("HAMMER");
  }
  adicionarComponente(componente) {
    if (this.Armario == null) return;
    if (this.Armario.adicionarComponente(componente)) {
      var isLight = false;
      if (componente.isLight != null) {
        isLight = componente.isLight
      }
      this.initdatGuiObjeto(componente, false, isLight);
      SceneComponent.componentes.push(componente);
      SceneComponent.collisions.addElement(componente);
      SceneComponent.hasChanged = true;
    }
  }
  onDocumentKeyDown(event) {
    var keycode = event.which;
    switch (keycode) {
      case 68://CASE D Wireframe
        {
          //console.log("Pressed D");
          //console.log(SceneComponent.instance.Armario);
          if (SceneComponent.instance.Armario != null) SceneComponent.instance.Armario.changeWireFrame();
        }
        break;
      case 27:
        {
          /*
          SceneComponent.INTERSECTED.material.emissive.setHex(SceneComponent.INTERSECTED.currentHex);
          SceneComponent.instance.objetoSelecionado.material.emissive.setHex(SceneComponent.instance.objetoSelecionado.currentHex);
          SceneComponent.INTERSECTED = null;
          SceneComponent.instance.objetoSelecionado = null;
          */
        }
        break;
      case 67:
        {
          if (SceneComponent.instance.whichCamera == 1) {
            SceneComponent.instance.initOrthoCamera();
            SceneComponent.instance.whichCamera = 2;
          }
          else {
            SceneComponent.instance.initCamera();
            SceneComponent.instance.whichCamera = 1;
          }

        }
        break;
    }
  }
}

function CollisionDetection() {
  var caster = new THREE.Raycaster();
  var rays = [];
  var elements = [];
  var map = {};
  var h;

  rays.push(new THREE.Vector3(0, -1, 0));
  rays.push(new THREE.Vector3(0, 1, 0));
  rays.push(new THREE.Vector3(1, 0, 0));
  rays.push(new THREE.Vector3(-1, 0, 0));
  rays.push(new THREE.Vector3(0, 0, -1));
  rays.push(new THREE.Vector3(0, 0, 1));

  this.testElement = function (element) {

    for (var i = 0; i < rays.length; i++) {
      caster.set(element.position, rays[i]);
      var hits = caster.intersectObjects(elements, true);
      for (var k = 0; k < hits.length; k++) {
        if (hits[k].distance === 0) {
          //console.log("hit", hits[k]);
          h = hits[k].object;
          var e = element.object;
          //console.log("elemento", element);
          h.material.emissive.setHex(0x0000ff);
        }
      }
    }
  }

  this.addRay = function (ray) {
    rays.push(ray.normalize());
  }
  this.addElement = function (element) {
    elements.push(element);
    if (element.material != null) {
      map[element] = element.material.getHex();
    }
  }
  this.addArray = function (arrays) {
    elements = arrays;
  }
  this.TestAll = function () {
    if (elements == []) return;
    var currentInstance = this;
    elements.forEach(element => {
      currentInstance.testElement(element);
    })
  }


}
