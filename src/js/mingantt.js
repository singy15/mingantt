import moment from 'moment';
import '../css/mingantt.css';

var mingantt = {
  data: function () {
    return {
      start_month: moment().add(-1, "months").format("YYYY-MM"),
      end_month: moment().add(2, "months").format("YYYY-MM"),
      block_size: 24,
      block_number: 0,
      calendars:[],
      inner_width: '',
      inner_height: '',
      task_width: '',
      task_height: '',
      today:moment(),
      categories: [
        {
          taskId: 1,
          subject: 'Category1',
          collapsed: false,
        }, {
          taskId: 2,
          subject: 'Category2',
          collapsed: false,
        }
      ],
      tasks: [],
      position_id: 0,
      dragging:false,
      pageX:'',
      elememt:'',
      left:'',
      task_id:'',
      width:'',
      leftResizing:false,
      rightResizing:false,
      task: '',
      show: false,
      formDefault: {
        categoryId: '',
        taskId: '',
        subject: '',
        planStartDate: '',
        planEndDate: '',
        actualStartDate: '',
        actualEndDate: '',
        assignedUserId: '',
        progress: 0,
        planWorkload: 0,
        actualWorkload: 0,
        planWorkloadMap: "",
        content: "",
        parentTaskId: 0
      },
      form: {
        categoryId: '',
        taskId: '',
        subject: '',
        planStartDate: '',
        planEndDate: '',
        actualStartDate: '',
        actualEndDate: '',
        assignedUserId: '',
        progress: 0,
        planWorkload: 0,
        actualWorkload: 0,
        planWorkloadMap: "",
        content: "",
        parentTaskId: 0
      },
      update_mode: false,
      encodeFn: null,
      decodeFn: null,
      rowHeight: 20,
      onUpdateTask: null, // (updateInfo => { update: [...], delete: [...], insert: [...] }) => void
      selectedTask: null,
      notifyStyle: {
        position: "absolute",
        display: "none",
      },
      notifyMessage: "",
      hideCompletedTask: false,
      collapseInfoSet: {},
      autoSetProgress: true
    };
  },
  template:
`
<div style="width:100%; height:100%;">
  <div :style="notifyStyle">
    {{ notifyMessage }}
  </div>

  <!-- Content -->
  <div id="gantt-content" class="mg-flex mg-h-full mg-w-full">
    <!-- List section -->
    <div id="gantt-task">
      <!-- Header -->
      <div id="gantt-task-title" class="mg-flex mg-items-center mg-bg-gray mg-text-white mg-h-15" ref="task">
        <div class="mg-col-header mg-border-l mg-border-r mg-w-12">ID</div>
        <div class="mg-col-header mg-border-r mg-w-96">Subject</div>
        <div class="mg-col-header mg-border-r mg-w-40">Pl/Term</div>
        <div class="mg-col-header mg-border-r mg-w-40">Ac/Term </div>
        <div class="mg-col-header mg-border-r mg-w-16">Assig.</div>
        <!--
        <div class="mg-col-header mg-border-r mg-w-12">Progr.</div>
        -->
        <div class="mg-col-header mg-border-r mg-w-12">Pl/WL</div>
        <div class="mg-col-header mg-border-r mg-w-12">Ac/WL</div>
      </div>
      <div id="gantt-task-list" class="mg-overflow-y-hidden" :style="'height:' + calendarViewHeight + 'px'">

        <div class="mg-flex mg-h-5 mg-border-b mg-bg-lightgray">
          <div class="mg-flex mg-items-center mg-w-full mg-text-xs mg-flex mg-items-center">
            <button @click="addTask" class="mg-bg-darkgray mg-text-white mg-px-4 mg-w-24 mg-flex mg-items-center mg-h-full mg-justify-center">
              <!--
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              -->
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <!--
              <span class=" mg-text-xs">Add</span>
              -->
            </button>
            <label class="mg-text-xs"><input type="checkbox" v-model="hideCompletedTask"/>Hide Cmpl.</label>
          </div>
        </div>

        <div v-for="(task,index) in displayTasks" :key="index" class="mg-flex mg-h-5 mg-border-b" 
            :style="((task.actualStartDate !== '') && (task.cat !== 'category'))? 'background-color: #EEF;' : ''" 
            :style="((task.actualEndDate !== '') && (task.cat !== 'category'))? 'background-color: #DDD;' : ''"
            :style="((selectedTask !== null) && (selectedTask.taskId === task.taskId))? 'background-color:rgba(253, 226, 184, 0.5)' : ''"
            @click="selectTask(task)">
          <!-- Template for category -->
          <template v-if="task.cat === 'category'">
            <div class="mg-flex mg-items-center mg-border-l mg-w-full mg-text-xs mg-pl-2 mg-flex  mg-items-center">
              <span>{{task.subject}}</span>
              <div class="pr-4" @click="toggleCategory(task.taskId)">
                <span v-if="task.collapsed">
                  <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span v-else>
                  <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
          </template>
          <!-- Template for task -->
          <template v-else>
            <div @click="editTask(task)" class="mg-flex mg-items-center mg-border-r mg-border-l mg-justify-center mg-w-12 mg-text-xs"
              draggable="true" @dragstart="dragTask(task)" @dragenter.prevent @dragover.prevent @drop.prevent="dragTaskOver(task)">
              {{task.taskId }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-w-96 mg-text-xs mg-pl-2">
              <!-- {{task.subject }} -->
              <span v-for="n of viewInfoSet[task.taskId].level" :key="n" style="display:inline-block; width:15px; height:100%; border:none; border-left:solid 1px #AAA; margin-left: 5px; box-sizing:border-box;"></span>
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-96" :style="'hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left;'" v-model="task.subject" >
              <div class="pr-4" @click="toggleCollapsed(task.taskId)" v-if="viewInfoSet[task.taskId].children">
                <span v-if="collapseInfoSet[task.taskId]">
                  <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span v-else>
                  <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.planStartDate" type="date">
              {{ formatDate2ShortDateStr(task.planStartDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.planEndDate" type="date">
              {{ formatDate2ShortDateStr(task.planEndDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.actualStartDate" type="date">
              {{ formatDate2ShortDateStr(task.actualStartDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.actualEndDate" type="date">
              {{ formatDate2ShortDateStr(task.actualEndDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-center mg-w-16 mg-text-xs">
              <!-- {{ task.assignedUserId }} -->
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-16" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.assignedUserId" >
            </div>
            <!--
            <div class="mg-flex mg-items-center mg-justify-center mg-w-12 mg-text-xs mg-border-r">
              {{ task.progress }}%
            </div>
            -->
            <div class="mg-flex mg-items-center mg-justify-center mg-w-12 mg-text-xs mg-border-r">
              <!-- {{ task.planWorkload }} -->
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-12 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0;" v-model="task.planWorkload" type="number">
            </div>
            <div class="mg-flex mg-items-center mg-justify-center mg-w-12 mg-text-xs">
              <!-- {{ task.actualWorkload }} -->
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-12 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0;" v-model="task.actualWorkload" type="number">
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Calendar section -->
    <div id="gantt-calendar" class="mg-overflow-x-scroll mg-overflow-y-hidden mg-border-l" :style="'width:' + calendarViewWidth + 'px'" ref="calendar">
      <div id="gantt-date" class="mg-h-15">
        <div id="gantt-year-month" class="mg-relative mg-h-5">
          <div v-for="(calendar,index) in calendars" :key="index">
            <div
              class="mg-text-black mg-bg-gray mg-text-dark mg-border-b mg-border-r mg-border-t mg-h-5 mg-absolute mg-text-xs mg-flex mg-items-center mg-justify-center"
              :style="'width:' + calendar.calendar*block_size + 'px;' + 'left:' + calendar.start_block_number*block_size + 'px'">
              {{calendar.date}}
            </div>
          </div>
        </div>
        <div id="gantt-day" class="mg-relative mg-h-10">
          <div v-for="(calendar,index) in calendars" :key="index">
            <div v-for="(day,index) in calendar.days" :key="index">
              <div class="mg-border-r mg-border-b mg-h-10 mg-absolute mg-flex mg-items-center mg-justify-center mg-flex-col mg-text-xs mg-bg-gray"
                   :class="{'mg-bg-darkgray mg-text-white': (day.dayOfWeek === 0 || day.dayOfWeek === 6)}"
                   :class="{'mg-bg-darkred mg-text-white': calendar.year=== today.year() && calendar.month === today.month() && day.day === today.date()}"
                   :style="'width:' + block_size + 'px;' + 'left:' + day.block_number*block_size + 'px'">
                <span style="text-align:center;">{{ day.day }}<br><span class="mg-text-xxs">{{ day.dayOfWeekStr }}</span></span>
              </div>
            </div>
          </div>
        </div>
        <div id="gantt-height" class="mg-relative">
          <div v-for="(calendar,index) in calendars" :key="index">
            <div v-for="day in calendar.days" :key="index">
              <div class="mg-border-r mg-border-b mg-absolute"
                   :class="{'mg-bg-lightgray': (day.dayOfWeek === 6 || day.dayOfWeek === 0)}"
                   :class="{'mg-bg-lightred': calendar.year=== today.year() && calendar.month === today.month() && day.day === today.date()}"
                   :style="'width:' + block_size + 'px;' + 'left:' + day.block_number*block_size + 'px;' + 'height:' + calendarViewHeight + 'px'">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bar Area -->
      <div id="gantt-bar-area" class="mg-relative" :style="'width:' + calendarViewWidth + 'px;' + 'height:' + calendarViewHeight + 'px'">
        <div v-for="(bar,index) in taskBars" :key="index">

          <!-- Focused -->
          <div :style="bar.barStyle" style="background-color:rgba(253, 226, 184, 0.5)" class="mg-absolute mg-h-2" v-if="(selectedTask !== null) && (bar.task.taskId === selectedTask.taskId)">
          </div>

          <!-- Focused -->
          <div :style="bar.barStyle" style="background-color:transparent; border-top:solid 1px #DDD;" class="mg-absolute mg-h-2">
          </div>

          <!-- Plan -->
          <div :style="bar.style" style="cursor:pointer; background-color:#dde5ff;" class="mg-absolute mg-h-2 mg-border mg-task" 
              v-if="bar.style.scheduled === true" @mousedown="mouseDownMove(bar.task)" 
              @click="selectTask(bar.task)">
            <div class="mg-w-full mg-h-full" style="pointer-events: none;">
              <div class="mg-h-full" 
                   style="pointer-events:none; background-color:#8492bd" 
                   :style="'width:' + bar.task.progress + '%'"></div>
            </div>
            <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                 style="top:3px;left:-6px;cursor:col-resize" 
                 @mousedown.stop="mouseDownResize(bar.task,'left')">
            </div>
            <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                 style="top:3px;right:-6px;cursor:col-resize" 
                 @mousedown.stop="mouseDownResize(bar.task,'right')">
            </div>
          </div>

          <!-- Actual -->
          <div :style="bar.actualStyle" style="cursor:pointer; " class="mg-absolute mg-h-2 mg-border mg-actual mg-task" 
              v-if="bar.actualStyle.scheduled === true" @mousedown="mouseDownMove(bar.task)" 
              @click="selectTask(bar.task)">
            <div class="mg-w-full mg-h-full mg-task" style="pointer-events: none;">
              <div class="mg-h-full" 
                   style="pointer-events:none; background-color:#8492bd" 
                   :style="'width:' + bar.task.progress + '%'"></div>
            </div>
            <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                 style="top:3px;left:-6px;cursor:col-resize" 
                 @mousedown.stop="mouseDownResize(bar.task,'left')">
            </div>
            <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                 style="top:3px;right:-6px;cursor:col-resize" 
                 @mousedown.stop="mouseDownResize(bar.task,'right')">
            </div>
          </div>

        </div>
      </div>

    </div>

  </div>

  <div id="form">
  </div>

  <!-- Header -->
  <div id="gantt-header" class="mg-h-12 mg-p-2 mg-flex mg-items-center" style="position:fixed;">
    <div class="mg-base" v-show="show"
      @keyup.ctrl.enter="(update_mode)? updateTask(form.taskId) : saveTask()"
      style="z-index:999;">
      <div class="mg-overlay" v-show="show" @click="show=false"></div>
      <div class="mg-content" v-show="show">
        <h2 v-if="update_mode">Edit Task</h2>
        <h2 v-else>Add Task</h2>
        <div class="mg-form-item">
          <div name="left" style="float:left; padding:5px;">
            <div class="mg-form-item">
              <label>ID: </label>
              <input class="mg-form-input mg-w-22" v-model.number="form.taskId" :disabled="update_mode">
              <!-- <label> Category: </label> -->
              <!-- <select v-model="form.categoryId" class=" mg-border mg-px-4 mg-py-2 mg-rounded-lg"> -->
              <!--   <option v-for="category in categories" :key="category.taskId" :value="category.taskId">{{ category.subject }} -->
              <!--   </option> -->
              <!-- </select> -->
            </div>
            <div class="mg-form-item">
            </div>
            <div class="mg-form-item">
              <label>Subject: </label>
              <input class="mg-form-input mg-w-full" v-model="form.subject">
            </div>
            <div class="mg-form-item">
              <label>AssignedTo: </label>
              <input class="mg-form-input mg-w-24" v-model="form.assignedUserId">
            </div>
            <div class="mg-form-item">
              <label>Pl. Term: </label>
              <input class="mg-form-input mg-no-rounded-br mg-no-rounded-tr" v-model="form.planStartDate" type="date">
              <input class="mg-form-input mg-no-rounded-bl mg-no-rounded-tl" v-model="form.planEndDate" type="date">
            </div>
            <div class="mg-form-item">
              <label>Ac. Term: </label>
              <input class="mg-form-input mg-no-rounded-br mg-no-rounded-tr" v-model="form.actualStartDate" type="date">
              <input class="mg-form-input mg-no-rounded-bl mg-no-rounded-tl" v-model="form.actualEndDate" type="date">
            </div>
            <div class="mg-form-item">
              <label>Pl. Workload: </label>
              <input class="mg-form-input mg-w-22" v-model="form.planWorkload" type="number">
              <label> WL/Map: </label>
              <input class="mg-form-input mg-w-22" v-model="form.planWorkloadMap">
            </div>
            <div class="mg-form-item">
              <label> Ac. Workload: </label>
              <input class="mg-form-input mg-w-22" v-model="form.actualWorkload" type="number">
              <label> Parent: </label>
              <input class="mg-form-input mg-w-22" v-model="form.parentTaskId" type="number">
            </div>
            <div class="mg-form-item">
              <label> Progress: </label>
              <input class="mg-form-input mg-w-22" v-model="form.progress" type="number"><span>%</span>
              <span>&nbsp;</span>
              <label><input type="checkbox" v-model="autoSetProgress"/>Auto-Set</label>
              <br>
              <progress :value="form.progress" max="100" class="mg-w-full"></progress>
              <br>
              <div class="mg-w-full" style="display:flex; justify-content: space-between;">
                <div style="cursor:pointer;" @click="setFormProgress(0)">0%</div>
                <div style="cursor:pointer;" @click="setFormProgress(25)">25%</div>
                <div style="cursor:pointer;" @click="setFormProgress(50)">50%</div>
                <div style="cursor:pointer;" @click="setFormProgress(75)">75%</div>
                <div style="cursor:pointer;" @click="setFormProgress(100)">100%</div>
              </div>
            </div>
          </div>
          <div name="right" style="float:right; padding:5px;">
            <div class="mg-form-item">
              <label>Desc: </label><br>
              <textarea class="mg-form-input mg-w-full" v-model="form.content" style="width:400px; height:400px; min-width:400px; min-height:400px;"></textarea>
            </div>
          </div>
        </div>
        <div style="clear:both;">
          <div v-if="update_mode" class="mg-flex mg-items-center mg-justify-left">
            <button @click="updateTask(form.taskId)" class="mg-green mg-text-white mg-py-2 mg-px-16 mg-rounded-lg mg-text-xs mg-flex mg-items-center">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="mg-text-xs  mg-text-white" style="white-space: nowrap;">Save and Close</span>
            </button>
            <button @click="updateTask(form.taskId, false)" class="mg-green mg-text-white mg-py-2 mg-px-16 mg-rounded-lg mg-text-xs mg-flex mg-items-center mg-ml-2">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="mg-text-xs  mg-text-white">Save</span>
            </button>
            <button @click="deleteTask(form.taskId)"
                    class="mg-red mg-text-white mg-py-2 mg-px-4 mg-rounded-lg mg-flex mg-items-center mg-ml-2" >
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="mg-text-xs mg-text-white">Delete</span>
            </button>
          </div>
          <div v-else>
            <button @click="saveTask"
              class="mg-indigo mg-text-white mg-py-2 mg-px-16 mg-rounded-lg mg-flex mg-items-center">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span class=" mg-text-xs">
                Register
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`,
  methods: {
    loadTasks(tasks) {
      if(this.encodeFn) {
        this.tasks = tasks.map(this.encodeFn);

        // Set collapse info
        this.tasks.map((x) => {
          let savedCollapseState = localStorage.getItem("mingantt/collapsed/" + x.taskId.toString());
          if(savedCollapseState) {
            this.collapseInfoSet[x.taskId] = JSON.parse(savedCollapseState);
          } else {
            this.collapseInfoSet[x.taskId] = false;
          }
        });
      } else {
        this.tasks = tasks;
      }
    },
    getTasks() {
      if(this.decodeFn) {
        return this.tasks.map(this.decodeFn);
      } else {
        return this.tasks;
      }
    },
    getDays(year, month, block_number) {
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let days = [];
      let date = moment(`${year}-${month}-01`);
      let num = date.daysInMonth();
      for (let i = 0; i < num; i++) {
        days.push({
          day: date.date(),
          dayOfWeek: date.day(),
          dayOfWeekStr: dayOfWeek[date.day()],
          block_number
        })
        date.add(1, 'day');
        block_number++;
      }
      return days;
    },
    getCalendar() {
      let block_number = 0;
      let days;
      let start_month = moment(this.start_month)
      let end_month = moment(this.end_month)
      let between_month = end_month.diff(start_month, 'months')
      for (let i = 0; i <= between_month; i++) {
        days = this.getDays(start_month.year(), start_month.format('MM'), block_number);
        this.calendars.push({
          date: start_month.format('YYYY/MM'),
          year: start_month.year(),
          month: start_month.month(),
          start_block_number: block_number,
          calendar: days.length,
          days: days
        })
        start_month.add(1, 'months')
        block_number = days[days.length - 1].block_number
        block_number++;
      }
      return block_number;
    },
    getWindowSize() {
      var content = window.document.querySelector("#gantt-content");
      this.inner_width = content.getBoundingClientRect().width;
      this.inner_height = content.getBoundingClientRect().height;
      this.task_width = this.$refs.task.offsetWidth;
      this.task_height = this.$refs.task.offsetHeight;
    },
    todayPosition() {
      this.$refs.calendar.scrollLeft = this.scrollDistance
    },
    windowSizeCheck() {
      let height = this.lists.length - this.position_id
      if (event.deltaY > 0 && height * 40 > this.calendarViewHeight) {
        this.position_id+=3
      } else if (event.deltaY < 0 && this.position_id !== 0) {
        this.position_id-=3
      }
    },
    mouseDownMove(task){
      this.dragging = true;
      this.pageX = event.pageX;
      this.element = event.target;
      this.left = event.target.style.left;
      this.task_id = task.taskId
      console.log('mouseDownMove')
    },
    mouseMove() {
      if (this.dragging) {
        let diff = this.pageX - event.pageX;
        this.element.style.left = `${parseInt(this.left.replace('px', '')) - diff}px`;
      }
    },
    stopDrag(){
      if (this.dragging) {
        let diff = this.pageX - event.pageX
        let days = Math.ceil(diff / this.block_size)
        if (days !== 0) {
          console.log(days)
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate).add(-days, 'days')
          let planEndDate = moment(task.planEndDate).add(-days, 'days')
          task['planStartDate'] = planStartDate.format('YYYY-MM-DD')
          task['planEndDate'] = planEndDate.format('YYYY-MM-DD')

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: [task]});
          }
        } else {
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.ceil(diff / this.block_size)
        if (days !== 0) {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate).add(-days, 'days')
          let planEndDate = moment(task.planEndDate)
          if (planEndDate.diff(planStartDate, 'days') <= 0) {
            task['planStartDate'] = planEndDate.format('YYYY-MM-DD')
          } else {
            task['planStartDate'] = planStartDate.format('YYYY-MM-DD')
          }

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: [task]});
          }
        } else {
          this.element.style.width = this.width;
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.rightResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.ceil(diff / this.block_size)
        if (days === 1) {
          this.element.style.width = `${parseInt(this.width.replace('px', ''))}px`;
        } else if (days <= 2) {
          days--;
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planEndDate = moment(task.planEndDate).add(-days, 'days')
          task['planEndDate'] = planEndDate.format('YYYY-MM-DD')

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: [task]});
          }
        } else {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate);
          let planEndDate = moment(task.planEndDate).add(-days, 'days')
          if (planEndDate.diff(planStartDate, 'days') < 0) {
            task['planEndDate'] = planStartDate.format('YYYY-MM-DD')
          } else {
            task['planEndDate'] = planEndDate.format('YYYY-MM-DD')
          }

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: [task]});
          }
        }
      }
      this.dragging = false;
      this.leftResizing = false;
      this.rightResizing = false;
    },
    mouseDownResize(task, direction) {
      direction === 'left' ? this.leftResizing = true : this.rightResizing = true;
      this.pageX = event.pageX;
      this.width = event.target.parentElement.style.width;
      this.left = event.target.parentElement.style.left;
      this.element = event.target.parentElement;
      this.task_id = task.taskId
    },
    mouseResize() {
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX
        if (parseInt(this.width.replace('px', '')) + diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) + diff}px`
          this.element.style.left = `${this.left.replace('px', '') - diff}px`;
        }
      }
      if (this.rightResizing) {
        let diff = this.pageX - event.pageX;
        if (parseInt(this.width.replace('px', '')) - diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) - diff}px`
        }
      }
    },
    dragTask(dragTask) {
      this.task = dragTask;
    },
    dragTaskOver(overTask) {
      let deleteIndex;
      let addIndex;



      // if (this.task.cat !== 'category') {
        // if (overTask.cat === 'category') {
        //   let updateTask = this.tasks.find(task => task.taskId === this.task.taskId)
        //   updateTask['categoryId'] = overTask['taskId']

        //   // Fires handler
        //   if(this.onUpdateTask) {
        //     this.onUpdateTask(this.task, "update");
        //   }
        // } else {
          if (overTask.taskId !== this.task.taskId && overTask.parentTaskId !== this.task.taskId) {
            // this.tasks.map((task, index) => { if (task.taskId === this.task.taskId) deleteIndex = index })
            // this.tasks.map((task, index) => { if (task.taskId === overTask.taskId) addIndex = index })
            // this.tasks.splice(deleteIndex, 1)
            // this.task['categoryId'] = overTask['categoryId']
            // this.tasks.splice(addIndex, 0, this.task)

            if(overTask.parentTaskId !== this.task.parentTaskId && overTask.parentTaskId !== this.task.taskId) {
              let before = this.task.parentTaskId;
              this.task.parentTaskId = overTask.parentTaskId;

              // Validate circular relation
              let checkCircularRelation = (task, tasks, state) => {
                if(state[task.taskId]) {
                  return false;
                }

                if(task.parentTaskId === 0) {
                  return true;
                }

                state[task.taskId] = true;

                let par = this.tasks.find(x => x.taskId === task.parentTaskId);

                return checkCircularRelation(par, tasks, state);
              };

              if(!checkCircularRelation(this.task, this.tasks, {})) {
                this.task.parentTaskId = before;
                alert("Error: circular relation!");
                return;
              }
            }

            let tmp = this.task.sortOrder;
            this.task.sortOrder = overTask.sortOrder;
            overTask.sortOrder = tmp;

            // Fires handler
            if(this.onUpdateTask) {
              this.onUpdateTask({update: [this.task, overTask]});
            }
          }
        // }
      // }
    },
    toggleCategory(task_id) {
      let category = this.categories.find(category => category.taskId === task_id)
      category['collapsed'] = !category['collapsed'];
    },
    toggleCollapsed(taskId) {
      this.collapseInfoSet[taskId] = !this.collapseInfoSet[taskId];
      localStorage.setItem("mingantt/collapsed/" + taskId.toString(), JSON.stringify(this.collapseInfoSet[taskId]));
    },
    addTask() {
      this.update_mode = false;
      this.form = {...this.formDefault};
      this.show = true;
    },
    saveTask() {
      let task = this.tasks.find(task => task.taskId === this.form.taskId);

      if(task) {
        alert("ID Confilict!");
        return;
      }

      // Auto set progress
      if(this.autoSetProgress && this.form.actualEndDate !== "") {
        this.form.progress = 100;
      } else if(this.autoSetProgress && this.form.actualEndDate === "") {
        this.form.progress = 0;
      }

      // Set sortOrder
      this.form.sortOrder = this.form.taskId;

      this.tasks.push(
        this.form
      )

      // Fires handler
      if(this.onUpdateTask) {
        this.onUpdateTask({insert: this.form});
      }

      // Clear form
      this.form = {}

      // Close edit form
      this.show = false
    },
    editTask(task, silent=false){
      this.update_mode=true;
      this.show = !silent;
      Object.assign(this.form, task);
      console.log(task);
      console.log(this.form);
    },
    updateTask(taskId, clear=true) {
      // Validate circular relation
      let checkCircularRelation = (task, tasks, state) => {
        if(state[task.taskId]) {
          return false;
        }

        if(task.parentTaskId === 0) {
          return true;
        }

        state[task.taskId] = true;

        let par = this.tasks.find(x => x.taskId === task.parentTaskId);

        return checkCircularRelation(par, tasks, state);
      };

      if(!checkCircularRelation(this.form, this.tasks, {})) {
        alert("Error: circular relation!");
        return;
      }

      // Auto set progress
      if(this.autoSetProgress && this.form.actualEndDate !== "") {
        this.form.progress = 100;
      } else if(this.autoSetProgress && this.form.actualEndDate === "") {
        this.form.progress = 0;
      }

      let task = this.tasks.find(task => task.taskId === taskId);
      Object.assign(task, this.form);

      // Fires handler
      if(this.onUpdateTask) {
        this.onUpdateTask({update: task});
      }

      if(clear) {
        // Clear form
        this.form = {}

        // Close edit form
        this.show = false;
      }
    },
    silentEditTask(task) {
      this.editTask(task, true);
      this.updateTask(task.taskId);
    },
    deleteTask(taskId) {
      if(this.tasks.find((x) => x.parentTaskId === taskId)) {
        alert("Delete children of this task first!");
        return;
      }

      let delete_index;
      this.tasks.map((task, index) => {
        if (task.taskId === taskId) delete_index = index;
      })

      let deleted = this.tasks.splice(delete_index, 1)

      // Fires handler
      if(this.onUpdateTask) {
        this.onUpdateTask({delete: [deleted[0]]});
      }

      // Clear form
      this.form = {}

      // Close edit form
      this.show = false;
    },
    formatDate2ShortDateStr(date) {
      if(date === "") {
        return "";
      }

      var cur = moment();
      var dt = moment(date);
      var pre = "";

      if(cur.format('YY') !== dt.format('YY')) {
        pre = dt.format('YY') + "/";
      }

      return pre + dt.format('M/D');
    },
    selectTask(task) {
      this.selectedTask = task;
    },
    showNotify(msg, time) {
      this.notifyMessage = msg;
      this.notifyStyle.display = "block";

      setTimeout(() => {
        this.notifyMessage = "";
        this.notifyStyle.display = "none";
      }, time);
    },
    setFormProgress(progress) {
      this.form.progress = progress;
    }
  },
  mounted() {
    this.getCalendar();
    this.getWindowSize();
    window.addEventListener('resize', this.getWindowSize);
    window.addEventListener('wheel', this.windowSizeCheck);
    window.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mousemove', this.mouseResize);
    window.addEventListener('mouseup', this.stopDrag);
    this.$nextTick(() => {
      this.todayPosition();
    });
  },
  computed: {
    calendarViewWidth() {
      return this.inner_width - this.task_width;
    },
    calendarViewHeight() {
      return this.inner_height - this.task_height;
    },
    scrollDistance() {
      let planStartDate = moment(this.start_month);
      let between_days = this.today.diff(planStartDate, 'days')
      return (between_days + 1) * this.block_size - this.calendarViewWidth / 2;
    },
    viewInfoSet() {
      console.log("calculate viewInfoSet");

      // Initialize taskHashSet and viewInfoSet
      let vis = {};
      let taskHashSet = {};
      let taskChildrenHashSet = {};
      this.tasks.map((x) => { 
        taskHashSet[x.taskId] = x; 
        vis[x.taskId] = {};
        if(x.parentTaskId !== 0) {
          if(taskChildrenHashSet[x.parentTaskId]) {
            taskChildrenHashSet[x.parentTaskId].push(x);
          } else {
            taskChildrenHashSet[x.parentTaskId] = [];
            taskChildrenHashSet[x.parentTaskId].push(x);
          }
        }
      });

      // format function
      let makeSortKey = (task) => {
        return task.sortOrder.toString().padStart(7,"0") + task.taskId.toString().padStart(7,"0");
      };

      // Calulate sortKey and level info
      let calcSortAndLevelInfo = (task, cur, tasks) => {
        return (task.parentTaskId === 0)? 
            cur 
            : calcSortAndLevelInfo(
                taskHashSet[task.parentTaskId], 
                { sortKey: makeSortKey(taskHashSet[task.parentTaskId]) + "-" + cur.sortKey, level: cur.level + 1 }, 
                tasks);
      };

      // Calculate show info
      let calcShowInfo = (x) => {
        if(x.parentTaskId === 0) {
          return true;
        }

        let par = taskHashSet[x.parentTaskId];

        return !this.collapseInfoSet[par.taskId] && calcShowInfo(par);
      };

      this.tasks.map((x) => {
        var vi = vis[x.taskId];

        // Set sortKey and level info
        let sortAndLevelInfo = calcSortAndLevelInfo(x, { sortKey: makeSortKey(x), level: 0 }, this.tasks);
        vi.sortKey = sortAndLevelInfo.sortKey;
        vi.level = sortAndLevelInfo.level;

        // Set show flag
        vi.show = calcShowInfo(x);

        // Set children
        vi.children = taskChildrenHashSet[x.taskId];
      });
      
      return vis;
    },
    lists() {
      const self = this;
      let lists = [];

      let vis = this.viewInfoSet;

      lists = this.tasks.filter((x) => {
        return vis[x.taskId].show;
      });

      lists.sort((a,b) => {
        let sortKeyA = vis[a.taskId].sortKey;
        let sortKeyB = vis[b.taskId].sortKey;

        if(sortKeyA < sortKeyB) {
          return -1;
        } else if(sortKeyA = sortKeyB) {
          return 0;
        }  else if(sortKeyA > sortKeyB) {
          return 1;
        }
      });

      return lists;
    },
    taskBars() {
      let planStartDate = moment(this.start_month);
      let top = 2 + this.rowHeight;
      let left;
      let leftAc;
      let between;
      let betweenAc;
      let start;
      let startAc;
      let style;
      let actualStyle;
      let barStyle;
      return this.displayTasks.map(task => {
        style = {}
        let date_from = moment(task.planStartDate);
        let date_to = moment(task.planEndDate);
        let ac_date_from = moment(task.actualStartDate);
        let ac_date_to = (task.actualEndDate !== "")? (moment(task.actualEndDate)) : (moment());
        between = date_to.diff(date_from, 'days');
        between++;
        betweenAc = ac_date_to.diff(ac_date_from, 'days');
        betweenAc++;
        start = date_from.diff(planStartDate, 'days');
        startAc = ac_date_from.diff(planStartDate, 'days');
        left = start * this.block_size - 1;
        leftAc = startAc * this.block_size - 1;
        style = {
          top: `${top}px`,
          left: `${left}px`,
          width: `${this.block_size * between + 1}px`,
          scheduled: (task.planStartDate !== ""),
        };
        actualStyle = {
          top: `${top+7}px`,
          left: `${leftAc}px`,
          width: `${this.block_size * betweenAc + 1}px`,
          scheduled: (task.actualStartDate !== ""),
        };
        var blocks = 0;
        this.calendars.map((cal) => {  
          blocks = blocks + cal.days.length;
        });
        barStyle = {
          top: `${top - 3}px`,
          height: `${this.rowHeight}px`,
          left: `${0}px`,
          width: `${this.block_size * blocks}px`,
        };
        top = top + this.rowHeight;
        return {
          style,
          actualStyle,
          barStyle,
          task
        }
      })
    },
    displayTasks() {
      let display_task_number = Math.floor(this.calendarViewHeight / this.rowHeight);
      return this.lists.slice(this.position_id, this.position_id + display_task_number);
    },
  }
};

window.mingantt = mingantt;

