'''
The dataframes module provides a lot of common operations for dataframe handling
'''

import pandas as pd
import math
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

def shuffle(df: pd.DataFrame) -> pd.DataFrame:
    '''Shuffles the DataFrame and returns it

    Args:
        df (pd.DataFrame): The DataFrame that should have its records shuffled

    Returns: 
        pd.DataFrame: The DataFrame that is shuffled
    '''

    return df.sample(frac=1).reset_index(drop=True)

def one_hot_encode(df: pd.DataFrame, column_name: str, drop_column:bool = True, prefix: str = None):
    '''Take a categorical column and pivots the DataFrame to add columns (0 or 1 value) for every category

    Args:
        df (pd.DataFrame): The DataFrame that contains the column to be encoded
        column_name (str): The name of the column that contains the categorical values
        drop_column (bool): Will remove the original column from the dataframe
        prefix (str): The prefix of the new columns.  By default the original column name will be taken

    Returns: 
        pd.DataFrame: The DataFrame with the one hot encoded features
    '''
    # Apply logic for previx columns
    if prefix == None:
        prefix = column_name

    # Apply one hot encoding
    df = pd.concat(
        [df, pd.get_dummies(df[column_name], prefix=prefix)], axis=1)

    if(drop_column):
        df.drop([column_name], axis=1, inplace=True)

    return df

def keep_numeric_features(df: pd.DataFrame):
    return df.select_dtypes(include=np.number)

def plot_features(df: pd.DataFrame, column_names = None, grid_shape = None, fig_size = None):
    # Take column names of all numeric columns
    if(column_names==None):
        # Default to all numeric columns
        column_names = keep_numeric_features(df).columns

    # Define grid shape
    if (grid_shape==None):
        # We will use 5 plots side/side by default or less in case of less columns
        grid_width = min(5, len(column_names))
        # Checking how much rows we need 
        grid_height = math.ceil(len(column_names) / grid_width) 
    else:
        grid_height, grid_width = grid_shape

    f, axes = plt.subplots(grid_height, grid_width, figsize=fig_size, sharex=False)

    _it = 0
    for col in column_names:
        _row = math.floor(_it / grid_width)
        _col = _it % grid_width
        try:
            sns.distplot(df[col], color='skyblue', ax= axes.ravel()[_it], label=col)
        except Exception as e:
            print('Exception in printing column', col, ':', _row, _col, e)
        _it += 1
    
    return f, axes