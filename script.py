import csv

def read_csv_and_group_by_continent(file_path):
    continent_country_dict = {}

    with open(file_path, mode='r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)

        for row in csv_reader:
            continent = row['continent']
            country = row['location']

            if continent not in continent_country_dict:
                continent_country_dict[continent] = []

            if country not in continent_country_dict[continent]:
                continent_country_dict[continent].append(country)

    return continent_country_dict

def save_to_txt(data, output_file_path):
    with open(output_file_path, mode='w', encoding='utf-8') as file:
        for continent, countries in data.items():
            file.write(f'"{continent}": {countries},\n')

# Ruta del archivo CSV de entrada y del archivo TXT de salida
input_file_path = 'owid-covid-data-procesado.csv'
output_file_path = 'continents_and_countries.txt'

# Leer el archivo CSV y agrupar los países por continente
continent_country_dict = read_csv_and_group_by_continent(input_file_path)

# Guardar los resultados en un archivo TXT
save_to_txt(continent_country_dict, output_file_path)

print(f"Los datos se han guardado en {output_file_path}")
