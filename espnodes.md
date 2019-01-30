# esp19
D1:   Limit1
D2:   Limit2
D5:   INA
D6:   INB
D7:   PWM
3V:   +5V--EN--
D0:   LED
D8:   Button


# esp20
04:   i2c
05:   i2c
12:   plant_michbaeck_1_water OUT
14:   plant_nichbaeck_1_water IN
16:   plant_michbaeck_1_power OUT
A0:   plant read
i2c:  light_michbaeck_5

helper: 1: plant_michbaeck_1
helper: 2: 
helper: 3: 
helper: 4: 

## rules1
```
//gpio,2,0 //LED ON

on recover do
  reboot
endon

on wateron do
  gpio,12,1
  delay 3000
  gpio,12,0
endon

on wateroff do
  gpio,12,0
endon

on GPIO14#plant_michbaeck_1_water do
  if [GPIO14#plant_michbaeck_1_water]=0
    gpio,2,0
  else
    gpio,2,1
  endif
endon

//on helper#plant_michbaeck_2 do
  //delay 10000
  //if [helper#plant_michbaeck_2]<30
    //event,wateron
  //endon
//endon

On System#Boot do
 gpio,16,1
 timerSet,1,2
endon

on plantrequest do
 gpio,16,1
 timerSet,1,2
endon

on Rules#Timer=1 do
  TaskValueSet,12,1,[analog#plant]
  gpio,16,0
  timerSet,2,3600
endon

On Rules#Timer=2 do
 gpio,16,1
 timerSet,1,2
endon
```

# esp21


# esp22



# esp27


## rules1
on recovery do
  reboot
endon

on speed1 do
  pwm,2,250
endon

on speed2 do
  pwm,2,500
endon

on speed3 do
  pwm,2,750
endon

on speed4 do
  pwm,2,1000
endon

on open do
  CANDLE:5:00ff00:255
  gpio,4,0
  gpio,5,1
endon

on close do
  CANDLE:5:ff0000:255
  gpio,4,1
  gpio,5,0
endon

on stop do
  gpio,4,0
  gpio,5,0
  CANDLE:0::
endon

on limit1#state=0 do //open
  event,stop
  CANDLE:1::255
  timerSet,1,10
endon

on limit2#state=0 do //close
  event,stop
endon

on button#state=0 do
  if [limit1#state]=0
    event,speed2
    event,close
  else
    if [limit2#state]=0
      event,speed2
      event,open
    endif
  else
    event,speed1
    event,open
  endif
endon

on rules#timer=1 do
  CANDLE:0::
endon
  