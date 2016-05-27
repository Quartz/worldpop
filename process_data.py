#!/usr/bin/env python

from collections import defaultdict
import csv
import json

"""
0     1        2     3       4    5      6           7          8       9         10
LocID,Location,VarID,Variant,Time,AgeGrp,AgeGrpStart,AgeGrpSpan,PopMale,PopFemale,PopTotal
"""


def main():
    f = open('data/WPP2015_INT_F3_Population_By_Sex_Annual_Single_Medium.csv', encoding='latin-1')
    reader = csv.reader(f)
    header = next(reader)

    current_country = None
    countries = []
    data = defaultdict(dict)

    for row in reader:
        country_code = row[0]
        country = row[1]

        if country_code != current_country:
            if current_country:
                save(current_country, data)

            current_country = country_code
            countries.append((country_code, country))

        year = row[4]
        age = row[6]
        male = row[8]
        female = row[9]

        data[year][age] = [male, female]

    f.close()

    save_index(countries)


def save(country, data):
    print('Saving %s' % country)

    with open('src/data/%s.json' % country, 'w') as f:
        json.dump(data, f)


def save_index(countries):
    print('Saving country index')

    with open('src/data/index.json', 'w') as f:
        json.dump(countries, f)


if __name__ == '__main__':
    main()
