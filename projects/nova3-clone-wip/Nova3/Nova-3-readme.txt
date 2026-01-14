Nova 3 - readme.txt 

Nova 3 is a generative sequencer. It is inspired by Otomata
(by Batuhan Bozkurt at http://www.earslap.com/), that 
uses cellular automata to generate emergent sequences of 
midi notes. 

This plugin does not generate any audio ouptut. It emits MIDI notes
which should be routed to a synth/sampler/instrument to produce audio.

To Install: 
  Copy the DLL that is appropriate for your DAW to where your 
  DAW looks for plugins.

     Nova32.dll is a 32-bit version of Nova
     Nova64.dll is a 64-bit version of Nova


  Copy the Nova3.ini file to the same folder as the DLL.

  Copy the NovaMidiMap.txt file somewhere on your host. It can be 
  in the same folder as the DLL but does not need to be. Edit the 
  Nova3.ini file and enter the full path, including the filename,
  to the location of the NovaMidiMap.txt file for the MidiMap entry.  
  
  Copy the scales folder somewhere on your host. It can be in the 
  same folder as the DLL but does not need to be. Edit the Nova3.ini
  file and enter the full path to the scales folder for the MidiMap entry. 
  
Overview:
  The idea is that a set of rovers move through a matrix of cells until
  they encounter a wall, another rover, or an obstacle. When a rover encounters
  a wall, it emits a midi note corresponding to the row and column, then reverses
  direction. When a rover encounters another rover, both rovers are rotated clockwise.
  When a rover encounters an obstacle, the effects of the obstacle are applied to 
  the rover which could alter its position, its direction, both, or neither 
  depending on the type of obstacle. 

Palettes:
  The Rover Palette and the Obstacle Palette are used to select rovers and obstacles
  to be inserted into the matrix. The palettes operate in one of two modes, the original 
  alpha mode (referred to as dual mode) or the new simplified mode (referred to as single mode)  
  
  In single mode, the palettes operate as a single selection tool. Selecting a rover 
  deselects an obstacle and selecting an obstacle deselects a rover. Left clicking in a 
  cell inserts the selected item. Right clicking in a cell clears the cells contents.

      Single mode
      ===========
      left-click  insert selected rover or obstacle
      
      right-click clear cell 
      
  In dual mode, the palettes operate independently, and there are more control options 
  for inserting and manipulating items.
  
      Dual mode
      =========
      left clicking on an empty cell in the matrix creates a new rover of the type 
      selected in the Rover palette. Clicking again changes the direction of the rover. 
      Clicking through all the directions will remove the rover. 
      
      Ctrl + left-click creates a rover that moves diagonally. 
     
      Shift + left-click removes a rover from a cell.

      Alt + left-click creates a new rover that moves at half-speed.
      
      Alt + Ctrl + left-click creates a new rover that moves diagonally at half-speed.

      Right click on a cell without an obstacles add a new obstacle to the 
      cell. Right clicking again again cycles through the obstacles. 

      Shift + right-click deletes the obstacle from a cell. 

      Ctrl + right-click inserts an obstacle of the type selected in 
      the Obstacles palette (upper left side of gui)
         
Obstacles: 
  There are 20 types of obstacles (described below). These are entirely 
  optional, you can get great results without any obstacles, they just 
  provide some additional techniques to affect the rovers. 
  
  In the obstacle descriptions, 
     N = Northbound, E = Eastbound, S = Southbound, W = Westbound
     NW = Northwest bound, NE = Northeast, SE = Southeast, SW = Southwest
     * = direction is determined by Wegde Algorithm (see below) 
     
  The obstacles are:
     |  horizontal mirror   N->N,   E->W,   S->S,   W->E
                            NE->NW, SE->SW, SW->SE, NW->NE
     -  vertical mirror     N->S,   E->E,   S->N,   W->W
                            NE->SE, SE->NE, SW->NW, NW->SW
     /  mirror up           N->E,   E->N,   S->W,   W->S
                            NE->NE, SE->NW, SW->SW, NW->SE
     \  mirror down         N->W,   E->S,   S->E,   W->E
                            NE->SW, SE->SE, SW->NE, NW->NW
     ^  wedge north         N->N,   E->N,   S->*,   W->N
     >  wedge east          N->E,   E->E,   S->E,   W->*
     v  wedge south         N->*,   E->S,   S->S,   W->S
     <  wedge west          N->W,   E->*,   S->W,   W->W
     X  bounce              rover moves to random neighbor cell and direction 
     :: wormhole            rover moves to random cell and direction 
     <> spin                rover changes to random direction 
     O  pause               every other rover pauses 1 step
     |. hor mirror flip     N->N,   E->W,   S->S,   W->E (then flip direction)
                            NE->NW, SE->SW, SW->SE, NW->NE
     -. vert mirror flip    N->S,   E->E,   S->N,   W->W (then flip direction) 
                            NE->SE, SE->NE, SW->NW, NW->SW
     /. mirror up flip      N->E,   E->N,   S->W,   W->S (then flip direction)
                            NE->NE, SE->NW, SW->SW, NW->SE
     \. mirror down flip    N->W,   E->S,   S->E,   W->E (then flip direction)
                            NE->SW, SE->SE, SW->NE, NW->NW
     ~  slow down           rover changes to slow pace 
     !  speed up            rover changes to normal pace 
     %  toggle pace         slow rovers become normal, normal become slow
     
  Redirection Algorithm: 
    When a rover moves into the tip point of a wedge obstacle the 
    direction of the rover is changed and the new direction is 
    alternated between the clockwise and counter-clockwise directions.
    
Other Controls:
  Note Probability - the probabiity of notes being emitted when 
  a wall is struck. 1.0 means all notes will be emitted, 0 means no notes 
  will be emitted. A value of .75 to .90 adds some subtle unpredictably to 
  static or nearly static sequences. 
  
  Tilt - applies a tilt to the note probability so that higher (or lower) 
  notes are given a higher probability. Tilt of 0.5 is level, all probabilties
  are equal. Tilt > 0.5 gives higher notes greater probability. Tilt < 0.5 
  gives lower notes greater probability.

  Obstacle Probability - the probability of an obstacle being applied 
  to a rover. 1.0 means obstacles will always affect rovers. 0 means
  all obstacles are effectively bypassed. 

  Limit - sets the maximum number of cycles that a rover
  may reside in a "collision group", shown as [] on the matrix. 
  A value of 0 disables the limit. A value greater than 0 limits 
  the amount of time a rover can remain in a cell with other rovers. 
  This is useful for preventing and for breaking up collision cells
  that gobble up rovers and don't let them go. 

  Wobble - the probability that rovers will deviate from their otherwise
  straight path. Good for introducing some chaos to static patterns. A value
  of 0 means rovers never wobble. 1.0 means rovers always wobble. 

  Repeat - the probability of a note being repeated (once). A value of 0
  means all wall strikes that emit notes will emit at most 1 note. A value 
  of 1.0 means emitted notes will be followed by a repeated note delayed 
  by the Repeat Length time unit.
  
  Repeat Length - the time unit for repeated notes. 
  
  Time - the speed at which the rovers advance through the matrix. Tied 
  to the host beats-per-minute.
  
  Slow - a speed variation factor to speed up and slow down the rovers
  or run them at non-exact beat subdivisions. 

  Length - the duration of the emitted MIDI notes. 
  
  Length Jitter - a range of length variations centered around the 
  value selected by the length knob. This adds some "humanization" 
  or variablity to the note lengths. 
    
  Velocity - the nominal output note velocity. The actual velocity for 
  each output note is influenced by the velocity step sequencer, the 
  velocity jitter and the number of simultaneous strikes to the same 
  note. When multiple strikes occur on the same note (could be different 
  tiles that map to the same scale note) at the same time only one note 
  is output but its velocity is increased by (10 x number of strikes) to 
  give some emphasis to the multiple hits.
  
  Velocity Jitter - a range of velocity variations centered around the 
  value selected by the velocity knob. This adds some "humanization" 
  or variablity to the note velocoties. 
    
  Chan - notes are output on this channel. 
  
  Rows - sets the number of rows in the matrix. 

  Cols - sets the number of columns in the marix. 
  
Climb Sliders

  The 4 sliders along the walls of the rover matrix set a climb distance
  for rovers that strike the wall. Climbing shifts a rover to a new column 
  or row when it strikes a wall. A climb of 0 leaves the rover in its 
  normal trajectory. Other values shift the rover along the wall.

Clear Panel 

  Newest - removes the most recently added rover.

  Oldest - removes the oldest rover in the matrix.

  Rovers - removes all rovers.

  Obstacles - removes all obstacles.

  All - removes all rovers and all obstacles. 

  The clear actions are handy for simplifying or taming an overly complex pattern. 
  They can also be used as a basic undo operation after adding rovers or obstacles.

Scale Panel (below the rover matrix)

  There are 4 scale variations. Each variation is based 
  on the current scale and allows you to alter the root
  pitch, the rotation, and the direction of the scale. 

  Wall - selects which walls use the scale variation. 
  Multiple walls can use the same scale variation. 
  Not all variations have to be used.

  Root Pitch - selects the pitch of the first note in the scale. 
  This pitch transposes the scale.

  Rotate - rotates the notes in the scale to change which scale 
  note (degree) is associated with each column/row. Rotating the scale 
  has an effect similar to a chord change.

  Direction - forward uses the notes in the order that the scale is 
  defined. Reverse uses the notes in reverse order.

  Some examples to ilustrate rotate and direction: 

    Starting scale:      A B C D 
    
     rotate 1            B C D A

     rotate 3            D A B C 

     reverse             D C B A 

     reverse, rotate 1   C B A D

  Mute - mutes the walls so that strikes on the wall do not emit notes.

Scale Loading

  The green triangle at the lower right corner of the scale panel 
  brings up a file dialog to load a scale file. Browse to the scale 
  folder and select and load a scale defintion. 

  The current scale name is displayed to the right of the triangle. 

Scales:
 
  The scales-description.txt file is a description of the initial set of scales for Nova 3.
  The file names start with a prefix (indicating a rough classification of the scale),
  followed by the scale name, followed by the greek classification for the number of
  tones in the octave: penta = 5 tones, hex = 6 tones, chroma = 12, etc.  
    
  The scales files have up to 17 notes. Missing notes are filled in by repeating 
  sections of the scale across the missing note positions. In the files a ';' character 
  indicates a comment and everything after the ';' is ignored. Blank lines are allowed.
  The non-commented non-blank lines must start with a number indicating a midi note.
  Everything following the number is ignored. Midi note numbers are 0 to 127.

  The first note in the file defines the root pitch of the scale. All other notes are 
  relative to this pitch. Nova automatically transposes scales so you can use whatever 
  root pitch is comfortable and convenient for you. 

Teal Panel
  
  The teal panel at the bottom of the gui is dual purpose. 

    The Patterns button activates the pattern panel. 
    The Seq button activates the sequencer panel. 
  
Pattern Panel 
  
  The patterns panel has 8 slots to capture matrix patterns. 
  Once captured a pattern may be restored to the matrix to return it's rovers 
  and obstacles to the state they were in when the pattern was captured. Only the 
  matrix contents are captured in a patter. The scales, speeds, probabilty knobs and 
  other controls are not part of the pattern that is saved.  

  Capure (Down triangle) - copies the rovers, obstacles and the matrix size to the 
  pattern slot. 

  Clear (X) - discards a previous capture. 

  Restore (box with upward triangle) - replaces the main matrix with the captured 
  pattern. 
  
Sequencer Panel

  The sequencer is a 32-step sequencer that runs at the same tempo as the matrix 
  defines a velocity scaling for each active step. The height of each step sets 
  the velocity scaling. Full height = full velocity, less height = lower velocity.
  Drag the mouse in the step sequencer bar area to change the heights.
  
  The Steps knob controls the number of steps that are active. The minumum is 1 active 
  step, the maximum is 32. 
  
  The Seq On led enables/disables the sequencer. When enabled, the velocity for notes
  is determined by multiplying the setting from the Velocity knob with the height of 
  the sequencer bar at the current step then adding in Velocity Jitter. 
  
  Each step can be muted. When muted the bar shows the unmuted height but the scaling is
  treated as velocity 0, i.e., notes are suppressed for sequence steps that are muted. 
  
  Each step can be locked. When locked the bar height does not change. 

  Pressing the Control key while dragging the mouse in the sequencer activates a linear
  scaling tool that resizes the steps between the anchor point and the drag point so that 
  the steps grow in linear velocity. Hard to describe, just press Control and drag around 
  in the sequencer - you can see how it operates.
  
Simplify

  The Simple knob thins out the note sequence by only allowing notes from every 
  N'th time cycle where N is the value of the simplify control. When simple is set to 1 
  notes at every cycle are emitted. When simple is set to 2 notes at every other cycle 
  are emitted. When simple is set to 4 notes at every 4th cycle are emitted, etc.
 
Humanize  

  The human knob introduces some "humanization" to the output notes. Note onsets and
  durations are varied as humanization is increased. The difference is subtle (maximum
  variation is about 15 milliseonds per note) but perceptible. Leave at 0 for rigid timing, 
  1.0 gives max variation. 

  Humanizing has the effect of de-flamming the note sequence somewhat. Adding humanization
  to a pattern that is emitting multiple notes at the same time will spread the notes out
  a little and lessen the effect of multiple note-ons at the exact same time.
  
Swing 

  The Swing knob introduces a simple swing to the cycle timer. With swing at 0 the cycles
  are not swung, each cycle is the same duration (1:1 ratio). A swing value of 1.0 makes 
  the first cycle twice as long as the second cycle (2:1 ratio) giving a full swing to the 
  generated notes. Intermediate values (for example, 0.10 or 0.25) add some nice motion 
  without becoming overtly syncopated.
  
Wrap Probabillity 

  The Wrap knob assigns a probability that rovers will "pass through" a wall and wrap around
  to the other side of the matrix rather than reflecting off the wall. A wrap value of 0 causes
  all rovers to reflect after encounterng a wall. A wrap value of 1.0 causes all rovers to pass
  through and wrap around.
  
Nearby Probabillity 

  The Nearby knob assigns a probability that a neighbor note will be selected for output
  when a wall is struck rather than the actual note that is struck by a rover. Neighbors
  are near neighbors, just one scale position less or greater than the struck position. 
  A value of 0 causes only struck notes to be emitted. A value of 1.0 causes only neighbor
  notes to be emitted. There is no control for selecting which of the neighbor notes will 
  be played, the neighbor is chosen at random.
  
  This is useful for introducing occasional variation to a note sequence without 
  disturbing the rover pattern. 
   
Double Time button

  The double time button [x2] doubles the rate of rover motion.
  
Half Time button

  The half time button [/2] halves the rate of rover motion.

Rover Palette

  The Rover palette allows you to select the rover ype to be inserted when left-clicking
  in the matrix. 

Matrix Flip controls

  The matrix flip controls reposition the rovers in the matrix. 
  
    flip horizontal     rotate around horizontal center of matrix
    flip vertical       rotate around vertical center of matrix
    shift up            moves rovers towards top 
    shift down          moves rovers towards bottom 
    shift left          moves rovers towards left
    shift right         moves rovers towards right
    rotate left         rotate rovers clockwise, in place 
    rotate right        rotate rovers counter-clockwise, in place
    stagger up          move rovers towards top, rovers on right move less than those on left
    stagger down        move rovers towards top, rovers on right move more than those on left
             
Play
  
  The Play led engages (or disengages) the generator. When engaged the rovers move 
  when the host transport is moving. When disengaged the rovers do not move even if 
  the transport is running.  

Nudge Newest 
Nudge Oldest 

  Move the newest (oldest) rover forwards one cell position
    
Drag Newest 
Drag Oldest 

  Move the newest (oldest) rover backwards one cell position
  
Configuration File

  On startup, Nova reads a text file describing some global configuration parameters.
  The file is named "Nova3.ini" and must reside in the same diectory as the Nova DLL.
  
  Comments in the Configuration file start with a semicolon ';' 
 
  Items in the configuration file are listed as name and value pairs. Values that 
  contain spaces (e.g., "\Program Files\...") should be enclosed in quotes. 

  The following items are configurable: 

    ScaleFolder    the folder where the scale files reside.
                    
    MidiMap        the name of the midi map file.
                   the default value is "NovaMidiMap.txt" in the DLL folder.
                   
    LowestOctave   the display preference for midi note names. 
                   valid values are 0, -1, and -2, for C0, C-1, and C-2, respectively          

    Palette        The palette operation mode. The default value is "single". 
                   Set this to "double" to enable dual palette mode.
                   
  Items that are not specified will be assigned their default values.  
  
MIDI Mapping

  On startup, Nova reads a text file describing the Midi assigmnents for its controls.
  By default the name of the file is "NovaMidiMap.txt" residing in the same diectory 
  as the Nova DLL but you can override that by declaring a different path in the Configuration
  File. For example,
  
        MidiMap    \path\to\myfolder\MyMapFile.txt 
        
  Comments in the Midi Map file start with a semicolon ';' 
 
  Midi assignments are specified as a control name and a midi control description. The 
  target names are the names of the VST parameters visible to the host. A midi description
  can be a control change description or a key number description. A control change description
  starts with 'cc' followed by the cc number, 0..127, and an optional channel description. 
  A key number description starts with 'k' followed by the key number, 0..127, and an optional 
  channel description. Channels are assumed to be 'omni' unless a channel description is present.
  A channel description starts with a colon ':' followed by the channel number 1..16.
  
  Here are some example assignments: 
  
    NumRows    cc21     ; CC 21 (channel = omni) controls NumRows
    NumCols    cc21:8   ; CC 21 (channel = 8)    controls NumCols
    
    Restore1   k60      ; note 60 (c5, channel = omni) controls pattern restore 1
    Restore2   k62      ; note 62 (d5, channel = omni) controls pattern restore 2
    Restore3   k64:16   ; note 64 (e5, channel = 16)   controls pattern restore 3
    Restore4   k65      ; note 65 (f5, channel = omni) controls pattern restore 4

General

    Right-click on most controls allows a precise value to be selected from a drop-down
    list or entered from the keyboard.
    
Changelog: 
  v0.1  2011-05-28 Alpha Release 
  v0.2  2011-05-31 + pattern capture slots
                   + striker colors enhanced 
                   + plugin state persisted on project save
  v0.3  2011-06-14 + Swing control
                   + Humanizer varies note onset and duration
                   + Wrap probability 
                   + Nearby probability 
                   + Simplifier control
                   + 32 step velocity sequencer
                   + Rover palette
                   + Midi mapping via NovaMidiMap.txt file
                   + Engine enable/disable 
                   + Double time button
                   + Half time button
                   + Matrix Flip actions
                   + Speed knob renamed Slow
                   + bugfix: send note(s) off when transport stops
                   + bugfix: select random direction from spin obstacle
                   + bugfix: fixed crash on Delete All button
                  !! persistent storage format changed
                     Projects saved with v0.2 will not restore correctly running v0.3
  v0.4  2011-06-18 + Repeat probability
                   + Configuration file 
                   + Support for non-SSE2 32-bit CPUs
                   + misc bugfixes and gui tweaks
  v0.5  2011-06-24 + bugfix: increase line length of .ini file
                   + bugfix: corrected velocity off by one
                   + bugfix: remove misleading comment in .ini file 
                   + bugfix: removed incorrect and excessive note-offs 
                   + bugfix: collision handler updated to rotate all rovers in a collision
                   + misc bugfixes and gui tweaks
  v0.6  2011-07-30 + Simplified Rover/Obstacle mouse controls
                   + Nudge and Drag controls
                   + Ramp Draw control for sequencer 
                   + Length Jitter
                   + Repeat Length
  v0.7  2011-12-23 + Misc bug fixes related to timing and host compatibility
                   + bugfix: Note probability tilt only applied when probability < 1.0 
                   + bugfix: check bounds on rover nudge or drag 
  v0.8 2012-05-28  + bugfix: corrected length jitter

  
Thanks to Batuhan Bozkurt for his elegant creativity which 
inspired the creation of this plugin.
