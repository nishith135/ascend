# Generated for Exercise model update

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exercises', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='exercise',
            name='force',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='exercise',
            name='mechanic',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='exercise',
            name='category',
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
        migrations.AddField(
            model_name='exercise',
            name='level',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='exercise',
            name='primary_muscles',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='exercise',
            name='secondary_muscles',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='exercise',
            name='instructions',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='exercise',
            name='stat_str',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='exercise',
            name='stat_vit',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='exercise',
            name='stat_agi',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='exercise',
            name='stat_end',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='exercise',
            name='stat_flx',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='exercise',
            name='stat_per',
            field=models.FloatField(default=0.0),
        ),
        migrations.AlterField(
            model_name='exercise',
            name='equipment',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='exercise',
            name='muscle_group',
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
    ]
