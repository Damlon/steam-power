const heatL=require("heatWrapper");

const burner=heatL.heatGiver(Block,TileEntity,"burner",{
  heatCapacity:500,
  minItemEfficiency:0.2,
  heatProduction:5/12,
  setStats(){
    this.super$setStats();
    this.stats.add(BlockStat.basePowerGeneration,Core.bundle.get("steam-power-heat-per-sec"),String(this.heatProduction*60));
    this.stats.add(BlockStat.productionTime,2,StatUnit.seconds);
  },
  setBars(){
    this.super$setBars();
    this.bars.add("heat",func(entity=>
      new Bar(prov(()=>Core.bundle.format("bar.heat")+": "+(typeof(entity["getHeat"])!=="function"?0.0:entity.getHeat()).toFixed(1)),prov(()=>Pal.lightFlame),floatp(()=>typeof(entity["getHeat"])!=="function"?0:entity.getHeat()/this.heatCapacity))
    ));
  },
  outputsItems(){
    return false;
  },
  setDefaults(){
    this.consumes.add(new ConsumeItemFilter(boolf(item=>this.getItemEfficiency(item)>=this.minItemEfficiency&&item.explosiveness<=0.7)).update(false).optional(true,false));
  },
  init(){
    this.setDefaults();
    this.super$init();
  },
  update(tile){
    const entity=tile.ent();
    entity.coolDownHeat();
    if(entity.getHeat()>25){
      this.giveHeat(tile);
    }
    if(entity.getProgress()<=0&&entity.items.total()>0){
      entity.setCurrentItem(entity.items.take());
      entity.modifyProgress(1);
      entity.addHeat(this.heatProduction*this.getItemEfficiency(entity.getCurrentItem())*entity.delta());
    }else if(entity.getProgress()>0){
      entity.subProgress(this.getProgressIncrease(entity,120));
      entity.addHeat(this.heatProduction*this.getItemEfficiency(entity.getCurrentItem())*entity.delta());
      if(Mathf.chance(Time.delta()/30)){
        Effects.effect(Fx.pulverizeSmall,entity.x+Mathf.range(this.size*4),entity.y+Mathf.range(this.size*4));
      }
    }
    if(entity.getHeat()>=this.heatCapacity) entity.kill();
  },
  draw(tile){
    this.super$draw(tile);
    Draw.color(Color.red,Color.orange,Math.max(0,Math.min((tile.entity.getHeat()-374)/100,1)));
    Draw.alpha(tile.entity.getHeat()/this.heatCapacity);
    Draw.rect(this.heatRegion,tile.drawx(),tile.drawy());
    Draw.color();
  },
  load(){
    this.super$load();
    this.heatRegion=Core.atlas.find(this.name+"-heat")
  },
  getItemEfficiency(item){
    return item!==null?item.flammability:0;
  },
},
{
  getProgress(){
    return this._progress;
  },
  modifyProgress(z){
    this._progress=z;
  },
  subProgress(y){
    this._progress-=y;
  },
  _progress:0,
  setCurrentItem(c){
    this._currentItem=c;
  },
  getCurrentItem(){
    return this._currentItem;
  },
  _currentItem:null,
});
burner.update=true;
burner.sync=true;
burner.baseExplosive=5;
burner.solid=true;
burner.hasPower=false;
