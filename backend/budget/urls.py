from rest_framework.routers import DefaultRouter

from .views import BudgetViewSet, ExpenseViewSet, SettlementViewSet

router = DefaultRouter()
router.register('budgets', BudgetViewSet, basename='budget')
router.register('expenses', ExpenseViewSet, basename='expense')
router.register('settlements', SettlementViewSet, basename='settlement')

urlpatterns = router.urls
