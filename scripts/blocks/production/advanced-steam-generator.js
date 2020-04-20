const advancedSteamGenerator=extendContent(LiquidConverter,"advanced-steam-generator",{
  heatCapacity:500,
  heatCons:0.125,
  inputsHeat(){
    return true;
  },
  setStats(){
    this.super$setStats();
    this.stats.remove(BlockStat.output);
    this.stats.add(BlockStat.output,this.outputLiquid.liquid,this.outputLiquid.amount*60,true);
    this.stats.add(BlockStat.output,Vars.content.getByName(ContentType.liquid,"steam-power-high-pressure-steam"),this.outputLiquid.amount*60,true);
    this.stats.remove(BlockStat.input);
    this.stats.add(BlockStat.input,String(this.heatCons*60.0)+" heat/sec","");
    this.stats.add(BlockStat.input,this.consumes.get(ConsumeType.liquid).liquid,this.consumes.get(ConsumeType.liquid).amount*60,true);
    this.stats.add(BlockStat.input,String(this.heatCons*60.0)+" heat/sec","");
    this.stats.add(BlockStat.input,this.consumes.get(ConsumeType.liquid).liquid,this.consumes.get(ConsumeType.liquid).amount*60,true);
    this.stats.remove(BlockStat.productionTime);
  },
  onDestroyed(tile){
    this.super$onDestroyed(tile);
    Sounds.explosionbig.at(tile);
    const entity=tile.ent();
    if(entity.getHeat()<350) return;
    Effects.effect(Fx.pulverize,tile.worldx(),tile.worldy());
    Damage.damage(tile.worldx(),tile.worldy(),16*this.size,50);
  },
  setBars(){
    this.super$setBars();
    this.bars.add("heat",func(entity=>
      new Bar(prov(()=>Core.bundle.format("bar.heat")+": "+entity.tile.entity.getHeat().toFixed(1)),prov(()=>Pal.lightFlame),floatp(()=>entity.tile.entity==null?0:entity.tile.entity.getHeat()/this.heatCapacity))
    ));
    this.bars.add("liquid2",func(entity=>
      new Bar(prov(()=>entity.liquids.get(Vars.content.getByName(ContentType.liquid,"steam-power-high-pressure-steam"))<=0.001?entity.liquids.get(this.outputLiquid.liquid)<=0.001?Core.bundle.get("bar.liquid"):this.outputLiquid.liquid.localizedName:Vars.content.getByName(ContentType.liquid,"steam-power-high-pressure-steam").localizedName)
      ,prov(()=>entity.tile.entity!=null?entity.tile.entity.getOutputCurrent().barColor():Color.black)
      ,floatp(()=>entity.tile.entity!=null?entity.liquids.get(entity.tile.entity.getOutputCurrent())/this.liquidCapacity:0))
    ));
  },
  update(tile){
    const entity=tile.ent();
    const liquid=Vars.content.getByName(ContentType.liquid,"steam-power-high-pressure-steam");
    entity.setOutputCurrent(entity.liquids.get(liquid)<=0.001?this.outputLiquid.liquid:liquid);
    c1=this.consumes.get(ConsumeType.liquid);
    entity.coolDownHeat();
    if(entity.liquids.get(c1.liquid)>=c1.amount&&374>tile.entity.getHeat()&&entity.getHeat()>=100&&entity.liquids.get(this.outputLiquid.liquid)<this.liquidCapacity-0.001){
      var use=Math.min(c1.amount*entity.delta(),this.liquidCapacity-entity.liquids.get(this.outputLiquid.liquid));
      this.useContent(tile,this.outputLiquid.liquid);
      entity.liquids.add(this.outputLiquid.liquid,use);
      entity.addHeat(-this.heatCons*(use/c1.amount));
      entity.liquids.remove(c1.liquid,use);
    }else if(entity.liquids.get(c1.liquid)>=c1.amount&&tile.entity.getHeat()>=374&&entity.liquids.get(liquid)<this.liquidCapacity-0.001){
      var use1=Math.min(c1.amount*entity.delta(),this.liquidCapacity-entity.liquids.get(liquid));
      this.useContent(tile,liquid);
      entity.liquids.add(liquid,use1);
      entity.addHeat(-this.heatCons*(use1/c1.amount));
      entity.liquids.remove(c1.liquid,use1);
    }
    this.tryDumpLiquid(tile,this.outputLiquid.liquid);
    this.tryDumpLiquid(tile,liquid);
    if(entity.getHeat()>=this.heatCapacity){
      entity.kill();
    }
  },
  shouldConsume(tile){
    return false;
  }

});
advancedSteamGenerator.entityType=prov(()=>extend(GenericCrafter.GenericCrafterEntity,{
  getHeat(){
    return this._heat;
  },
  modifyHeat(a){
    this._heat=a
  },
  addHeat(b){
    this._heat+=b
  },
  coolDownHeat(){
    if(this._heat>25){
      this._heat-=Time.delta()*this._heat/1200;
    }else if(this._heat<25){
      this._heat=25;
    }
  },
  _heat:25,
  setOutputCurrent(c){
    this._outputCurrent=c;
  },
  getOutputCurrent(){
    if(this._outputCurrent==null) return Liquids.water;
    return this._outputCurrent;
  },
  _outputCurrent:null,
}));
advancedSteamGenerator.sync=true;