import csv

with open('owners.csv', 'w') as csvfile:
    owner_writer = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    with open('owners.csv','r') as csvfile:
        owner_reader = csv.reader(csvfile, delimiter=',', quotechar='"')
        for owner in owner_reader:
            owner_writer.writerow(owner[0:2])