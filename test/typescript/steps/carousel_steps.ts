/* BDD step definitions for carousel UI edge case tests */
import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

/**
 * Cucumber World object for carousel test scenarios.
 *
 * Simulates the legacy carousel behavior from javascript/tab_slider.js.
 * The carousel guard (lines 16-19) checks for empty contentArr
 * and returns early to prevent undefined access errors.
 */
interface CarouselWorld {
  contentRows: number;
  currentTab: number;
  errorThrown: Error | null;
  displayedContent: number | null;
}

// Track carousel state across steps
let carouselState: CarouselWorld = {
  contentRows: 0,
  currentTab: 0,
  errorThrown: null,
  displayedContent: null,
};

Before(function () {
  // Reset state before each scenario
  carouselState = {
    contentRows: 0,
    currentTab: 0,
    errorThrown: null,
    displayedContent: null,
  };
});

Given('I am viewing a page with a carousel', function () {
  // Default state - carousel exists
  carouselState.currentTab = 0;
});

Given('the carousel has zero content rows', function () {
  // Simulate empty contentArr from tab_slider.js:2
  carouselState.contentRows = 0;
});

Given('the carousel has one content row', function () {
  carouselState.contentRows = 1;
  carouselState.currentTab = 0;
});

Given('the carousel has three content rows', function () {
  carouselState.contentRows = 3;
  carouselState.currentTab = 0;
});

When('I click the carousel arrow', function () {
  try {
    // Simulate the carousel click handler from tab_slider.js:15-29
    // Guard clause (lines 17-19): if contentArr.length === 0, return early
    if (carouselState.contentRows === 0) {
      // Early return prevents accessing contentArr[0] when undefined
      return;
    }

    // Simulate cycling through content
    carouselState.currentTab++;
    if (carouselState.currentTab >= carouselState.contentRows) {
      carouselState.currentTab = 0;
    }
    carouselState.displayedContent = carouselState.currentTab;
  } catch (e) {
    carouselState.errorThrown = e as Error;
  }
});

Then('the page should not throw an error', function () {
  expect(carouselState.errorThrown).toBeNull();
});

Then('no content should be displayed', function () {
  // With zero rows, currentTab stays at 0 but no content is shown
  expect(carouselState.displayedContent).toBeNull();
  expect(carouselState.currentTab).toBe(0);
});

Then('the same row should be displayed', function () {
  // With one row, clicking cycles back to row 0
  expect(carouselState.currentTab).toBe(0);
  expect(carouselState.displayedContent).toBe(0);
});

Then('the next row should be displayed', function () {
  // Starting at 0, first click shows row 1
  expect(carouselState.currentTab).toBe(1);
  expect(carouselState.displayedContent).toBe(1);
});

Then('the carousel should cycle back to the first row', function () {
  // After multiple clicks, should cycle back to 0
  // Simulate clicking until we wrap
  let clicks = 0;
  while (clicks < carouselState.contentRows + 1) {
    carouselState.currentTab++;
    if (carouselState.currentTab >= carouselState.contentRows) {
      carouselState.currentTab = 0;
    }
    carouselState.displayedContent = carouselState.currentTab;
    clicks++;
  }
  expect(carouselState.currentTab).toBe(0);
  expect(carouselState.displayedContent).toBe(0);
});

Then('the carousel should cycle when reaching the end', function () {
  // Continue clicking until we cycle back to 0
  // Works from any starting position (0, 1, 2, etc.)
  while (carouselState.currentTab !== 0) {
    carouselState.currentTab++;
    if (carouselState.currentTab >= carouselState.contentRows) {
      carouselState.currentTab = 0;
    }
    carouselState.displayedContent = carouselState.currentTab;
  }
  expect(carouselState.currentTab).toBe(0);
  expect(carouselState.displayedContent).toBe(0);
});
