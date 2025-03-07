import type { ActivityType, MealType } from '@/lib/types';


class addActivityService {
    EXERCISE_TYPES: ActivityType[] = [
      'Run',
      'Cycle',
      'Swim',
      'Walk',
      'Strength Training',
      'Yoga',
      'HIIT',
      'Custom'
    ];
    
    MEAL_TYPES: MealType[] = [
      'Breakfast',
      'Lunch',
      'Dinner',
      'Snack',
      'Custom'
    ];
    
    COMMON_FOOD_TYPES = [
      'Fruits',
      'Vegetables',
      'Grains',
      'Protein',
      'Dairy',
      'Beverages',
      'Snacks',
      'Custom'
    ];

    get getExerciseTypes() {
        return this.EXERCISE_TYPES;
    }

    get getCommonFoodTypes(){
        return this.COMMON_FOOD_TYPES;
    }

    get getMealTypes() {
        return this.MEAL_TYPES;
    }
}

export default addActivityService;