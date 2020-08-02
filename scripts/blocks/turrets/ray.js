const ray=extendContent(PowerTurret,"ray",{
  shootDuration:40,
  getrotX(degree,distance){
    degree=Math.PI*degree/180;
    var pointX=distance*Mathf.cos(degree);
    return pointX;
  },
  getrotY(degree,distance){
    degree=Math.PI*degree/180;
    var pointY=distance*Mathf.sin(degree);
    return pointY;
  },
  //미관통 레이저 거리계산용
  distCal(tile){
    if(tile.entity==null||tile.entity.target==null) return;
    var dx=tile.entity.getX()-tile.entity.target.getX();
    var dy=tile.entity.getY()-tile.entity.target.getY();
    tile.entity.modifyDist(Mathf.sqrt(dx*dx+dy*dy));
  },
  // 물 못받게 하기
  handleLiquid(tile,source,liquid,amount){},
  acceptLiquid(tile,source,liquid,amount){},
  setBars(){
    this.super$setBars();
    this.bars.remove("liquid");
  },
  setStats(){
    this.super$setStats();
    this.stats.remove(BlockStat.booster);
    this.stats.remove(BlockStat.damage);
    this.stats.add(BlockStat.damage,this.shootType.damage*60/5,StatUnit.perSecond);
  },
  //지속딜 구현
  update(tile){
    this.super$update(tile);
    this.distCal(tile);
    if(tile.entity.getLife()>0&&tile.entity.getBullet()!=null){
      this.findTarget(tile);
      this.tr.trns(tile.entity.rotation,this.size*this.tilesize/2,0);
      tile.entity.getBullet().set(tile.drawx()+this.getrotX(tile.entity.rotation,this.size*4),tile.drawy()+this.getrotY(tile.entity.rotation,this.size*4));
      tile.entity.getBullet().rot(tile.entity.rotation);
      tile.entity.heat=1;
      tile.entity.recoil=this.recoil;
      tile.entity.getBullet().time(0);
      tile.entity.subLife(Time.delta());
      if(tile.entity.getLife()<=0){
        tile.entity.modifyBullet(null);
      }
    }else{
      tile.entity.decreaseDamage();
    }
  },
  bullet(tile,type,angle){
    tile.entity.modifyBullet(Bullet.create(type,tile.entity,tile.getTeam(),tile.drawx()+this.tr.x,tile.drawy()+this.tr.y,angle));
  },
  shouldActiveSound(tile){
    return tile.entity.getLife()>0&&tile.entity.getBullet()!=null;
  },
  updateShooting(tile){
    const entity=tile.ent();
    if(entity.cons.valid()) entity.modifyLife(10);

    if(entity.getLife()>0&&entity.getBullet()!=null){
      entity.increaseDamage();
      return;
    }

    if(entity.reload>=this.reload&&(entity.cons.valid()||tile.isEnemyCheat())){
      var type=this.peekAmmo(tile);
      this.shoot(tile,type);
      entity.reload=0;
    }else{
      entity.reload+=entity.delta();
    }
  },
  //무조건 가장 가까운 적 공격
  findTarget(tile){
    const entity=tile.entity;
    const old=entity.target;
    if(this.targetAir&&!this.targetGround){
      entity.target=Units.closestEnemy(tile.getTeam(),tile.drawx(),tile.drawy(),this.range,boolf(e=>e.isFlying()&&!e.isDead()));
    }else{
      entity.target=Units.closestTarget(tile.getTeam(),tile.drawx(),tile.drawy(),this.range,boolf(e=>!e.isDead()&&(!e.isFlying()||this.targetAir)&&(e.isFlying()||this.targetGround)));
    }
    if(old!=entity.target) entity.decreaseDamage()
  }
});
//지속딜용 엔티티속성 추가
ray.entityType=prov(()=>extend(Turret.TurretEntity,{
  getLife(){
    return this.bulletLife;
  },
  modifyLife(a){
    this.bulletLife=a;
  },
  subLife(b){
    this.bulletLife-=b;
  },
  getBullet(){
    return this._bullet;
  },
  modifyBullet(c){
    this._bullet=c;
  },
  modifyDist(d){
    this._dist=d;
  },
  getDist(){
    return this._dist;
  },
  increaseDamage(){
    if(this._damageMultiplier<2.5){
      this._damageMultiplier+=this.delta()/160;
    }else if(this._damageMultiplier>2.5){
      this._damageMultiplier=2.5;
    }
  },
  decreaseDamage(){
    this._damageMultiplier=1;
  },
  getDamage(){
    return this._damageMultiplier;
  },
  _bullet:null,
  bulletLife: 0,
  _dist:0,
  _damageMultiplier:1,
}));
ray.heatColor=Color.red;
ray.rotatespeed=2;
//커스텀 레이저
var colors=[Color.forest.cpy().mul(1,1,1,0.4),Color.lime.cpy().mul(1,1,1,0.7),Color.green,Color.acid];
var tscales=[1,0.7,0.5,0.2];
var lenscales=[-20,-13,-6,1];
var length=240;
var circlescales=[10,8,6,4];
if (typeof(floatc2)== "undefined"){
	const floatc2 = method => new Floatc2(){get : method};
}
const hitLaser1 = newEffect(5,e=>{
  for(var i=1;i<circlescales.length;i++){
    Draw.color(colors[i]);
    Fill.circle(e.x,e.y,circlescales[i]*e.fout());
    Draw.color(colors[1]);
    Lines.stroke(e.fout()*2);
    Angles.randLenVectors(e.id,2,e.finpow()*18,e.rotation,360,floatc2((x,y)=>{
      var ang=Mathf.angle(x,y);
      Lines.lineAngle(e.x+x,e.y+y,ang,e.fout()*4+1);
    }))
  }

});
ray.shootType = extend(BasicBulletType,{
  //관통데미지
  update(b){
    if(b==null) return;
    if(b.timer.get(1,5)){
      const target=b.getOwner().target;
      print(b.getOwner().getDamage())
      if(target!=null){
        var result=Predict.intercept(b.getOwner(),target,this.speed);
        if(result.isZero()) result.set(target.getX(),target.getY());
        var targetRot=result.sub(b.getOwner().tile.drawx(),b.getOwner().tile.drawy()).angle();
        if(Angles.angleDist(b.getOwner().rotation,targetRot)<10){
          target.damage(this.damage*b.getOwner().getDamage());
          this.hit(b,target.x,target.y);
        }
      }
    }
    Effects.shake(1,1,b.x,b.y);
  },
  //화염 적용
  hit(b,hitx,hity){
    Effects.effect(this.hitEffect,colors[3],hitx!=null?hitx:b.x,hity!=null?hity:b.y);
    if(Mathf.chance(0.4)){
      Fire.create(Vars.world.tileWorld(hitx + Mathf.range(5), hity + Mathf.range(5)));
    }
  },
  draw(b){
    var baseLen=length*b.fout();
    for(var s=0;s<colors.length;s++){
      Draw.color(colors[s]);
      for(var i=0;i<colors.length;i++){
        Lines.stroke((7+Mathf.absin(Time.time(),0.8,1.5))*b.fout()*(s==0 ? 1.5:s==1 ? 1.1:s==2?0.7:0.3)*tscales[i]);
        Lines.lineAngle(b.x,b.y,b.rot(),b.getOwner().getDist()+lenscales[i]>0?b.getOwner().getDist()+lenscales[i]:1);
      }
    }
    Draw.reset();
  }
});
ray.shootType.hitSize=3;
ray.shootType.despawnEffect=Fx.none;
ray.shootType.hitEffect=hitLaser1;
ray.shootType.damage=25;
ray.shootType.pierce=true;
ray.shootType.speed=0.001;
ray.shootType.lifetime=16;
