const heatL=require("heatWrapper");
const electricBurner=heatL.heatGiver(Block,TileEntity,"electric-burner",{
  heatCapacity:300,
  heatProduction:1/3,
  setStats(){
    this.super$setStats();
    this.stats.add(BlockStat.basePowerGeneration,Core.bundle.get("steam-power-heat-per-sec"),String(this.heatProduction*60));
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
  update(tile){
    const entity=tile.ent();
    entity.coolDownHeat();
    if(entity.getHeat()>25){
      this.giveHeat(tile);
    }
    if(entity.cons.valid()){
      entity.cons.trigger();
      entity.addHeat(this.heatProduction*entity.efficiency()*entity.delta());
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
  }
},{});
electricBurner.update=true;
electricBurner.sync=true;
electricBurner.baseExplosive=5;
electricBurner.solid=true;
electricBurner.hasItems=false;
