<template>
  <div class="input-group">
    <select
      class="form-select form-select-sm col-4"
      v-model.number="hour"
      @change="update"
    >
      <option v-for="hour in 24" :key="hour" :value="hour - 1">
        {{ hour - 1 }}h
      </option>
    </select>
    <select
      class="form-select form-select-sm col-4"
      v-model.number="minute"
      @change="update"
    >
      <option v-for="minute in 60" :key="minute" :value="minute - 1">
        {{ minute - 1 }}m
      </option>
    </select>
    <select
      class="form-select form-select-sm col-4"
      v-model.number="second"
      @change="update"
    >
      <option v-for="second in 60" :key="second" :value="second - 1">
        {{ second - 1 }}s
      </option>
    </select>
    <button class="btn btn-sm btn-secondary disabled" type="button">
      <fa icon="clock" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.btn img {
  vertical-align: sub;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "TimePicker",
  props: {
    modelValue: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  methods: {
    update: function () {
      this.$emit(
        "update:modelValue",
        this.hour * 3600 + this.minute * 60 + this.second
      );
    },
  },
  data: function () {
    return {
      hour: 0,
      minute: 0,
      second: 0,
    };
  },
  created() {
    this.hour = Math.floor(this.modelValue / 3600);
    const left_seconds = this.modelValue - this.hour * 3600;
    this.minute = Math.floor(left_seconds / 60);
    this.second = left_seconds - this.minute * 60;
  },
});
</script>
