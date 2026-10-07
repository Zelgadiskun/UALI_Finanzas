import { describe, it, expect, beforeEach } from "vitest";
import {
  EDUCATION_PROGRESS_STORAGE_KEY,
  getStoredEducationProgress,
  saveEducationProgress,
  completeSubLessonAction,
  setLessonActiveStepAction,
  getLessonResumeStep,
  getLessonSubProgress,
  getEducationStats,
  resetEducationCacheForTesting,
} from "./educationStore";
import { DEFAULT_LESSONS } from "./lessonsData";

describe("Education State Management System", () => {
  beforeEach(() => {
    localStorage.clear();
    resetEducationCacheForTesting();
  });

  it("initializes with empty completed sub-lessons", () => {
    const state = getStoredEducationProgress();
    expect(state.completedSubLessonIds).toEqual([]);
    expect(state.lessonActiveStep).toEqual({});
  });

  it("marks a sub-lesson as completed and updates state", () => {
    const result = completeSubLessonAction({
      lessonId: "lesson-intro",
      slug: "intro",
      subLessonId: "intro-sub-1",
      stepIndex: 0,
      userId: "test-user",
    });

    expect(result.isFirstTime).toBe(true);
    expect(result.nextStep).toBe(1);

    const updated = getStoredEducationProgress();
    expect(updated.completedSubLessonIds).toContain("intro-sub-1");
    expect(updated.lessonActiveStep["intro"]).toBe(1);
    expect(updated.subLessonCompletedAt["intro-sub-1"]).toBeDefined();
  });

  it("does not award micro-rewards twice for the same sub-lesson", () => {
    const first = completeSubLessonAction({
      lessonId: "lesson-intro",
      slug: "intro",
      subLessonId: "intro-sub-1",
      stepIndex: 0,
    });
    expect(first.isFirstTime).toBe(true);

    const second = completeSubLessonAction({
      lessonId: "lesson-intro",
      slug: "intro",
      subLessonId: "intro-sub-1",
      stepIndex: 0,
    });
    expect(second.isFirstTime).toBe(false);
  });

  it("calculates granular sub-lesson progress correctly", () => {
    const lesson = DEFAULT_LESSONS[0]; // intro with 3 sub-lessons
    const sub1 = lesson.subLessons![0].id;
    const sub2 = lesson.subLessons![1].id;

    completeSubLessonAction({
      lessonId: lesson.id,
      slug: lesson.slug,
      subLessonId: sub1,
      stepIndex: 0,
    });

    const prog1 = getLessonSubProgress(lesson, [sub1]);
    expect(prog1.completedCount).toBe(1);
    expect(prog1.totalCount).toBe(3);
    expect(prog1.percentage).toBe(33);
    expect(prog1.isAllSubsCompleted).toBe(false);

    completeSubLessonAction({
      lessonId: lesson.id,
      slug: lesson.slug,
      subLessonId: sub2,
      stepIndex: 1,
    });

    const prog2 = getLessonSubProgress(lesson, [sub1, sub2]);
    expect(prog2.completedCount).toBe(2);
    expect(prog2.percentage).toBe(67);
  });

  it("resumes at the next uncompleted sub-lesson step", () => {
    const lesson = DEFAULT_LESSONS[0];
    const sub1 = lesson.subLessons![0].id;

    // Initially starts at 0
    expect(getLessonResumeStep(lesson, new Set())).toBe(0);

    // Complete sub1
    completeSubLessonAction({
      lessonId: lesson.id,
      slug: lesson.slug,
      subLessonId: sub1,
      stepIndex: 0,
    });

    // Should resume at step 1
    expect(getLessonResumeStep(lesson, new Set())).toBe(1);
  });

  it("computes overall education statistics across all 12 lessons", () => {
    const stats = getEducationStats(DEFAULT_LESSONS);
    expect(stats.totalPrimaryLessons).toBe(12);
    expect(stats.totalSubLessons).toBe(36);
    expect(stats.completedSubLessons).toBe(0);
    expect(stats.overallPercentage).toBe(0);

    // Complete 3 sub-lessons
    const l1 = DEFAULT_LESSONS[0];
    for (let i = 0; i < 3; i++) {
      completeSubLessonAction({
        lessonId: l1.id,
        slug: l1.slug,
        subLessonId: l1.subLessons![i].id,
        stepIndex: i,
      });
    }

    const state = getStoredEducationProgress();
    const updatedStats = getEducationStats(DEFAULT_LESSONS, state, [l1.id]);
    expect(updatedStats.completedSubLessons).toBe(3);
    expect(updatedStats.completedPrimaryLessons).toBe(1);
    expect(updatedStats.overallPercentage).toBe(8); // 3/36 = 8.33% -> 8%
  });
});
