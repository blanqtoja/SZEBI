from django.db import models
from django.contrib.auth.models import AbstractUser, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver


class Role(models.Model):
    """Role model representing user roles in SZEBI.

    Uses a set of predefined role keys to match the project's use-cases.
    Roles may be linked to Django permissions if needed (via the
    `permissions` ManyToManyField).
    """

    ADMIN = 'building_admin'
    WORKER = 'worker'
    MAINTENANCE = 'maintenance_engineer'
    ENERGY_PROVIDER = 'energy_provider'

    ROLE_CHOICES = [
        (ADMIN, 'Administrator Budynku'),
        (WORKER, 'Pracownik'),
        (MAINTENANCE, 'Inżynier Utrzymania Ruchu'),
        (ENERGY_PROVIDER, 'Dostawca Energii'),
    ]

    name = models.CharField(max_length=64, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)

    def __str__(self):
        return dict(self.ROLE_CHOICES).get(self.name, self.name)


class User(AbstractUser):
    """Custom user model that attaches a Role to each user.

    Keeping `AbstractUser` preserves username/email/password workflows
    and integrates cleanly with Django admin and auth system.
    """

    role = models.ForeignKey(Role, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')

    @property
    def is_building_admin(self):
        return self.role and self.role.name == Role.ADMIN

    @property
    def is_worker(self):
        return self.role and self.role.name == Role.WORKER

    @property
    def is_maintenance_engineer(self):
        return self.role and self.role.name == Role.MAINTENANCE

    @property
    def is_energy_provider(self):
        return self.role and self.role.name == Role.ENERGY_PROVIDER


@receiver(post_migrate)
def create_default_roles(sender, **kwargs):
    """Create role rows after migrations so roles exist for assignment.

    Only run when the `core` app migrations are applied.
    """
    if sender.name != 'core':
        return
    for key, label in Role.ROLE_CHOICES:
        Role.objects.get_or_create(name=key, defaults={'description': label})
